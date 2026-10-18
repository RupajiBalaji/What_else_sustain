import json
import math
from pathlib import Path
from typing import Any, Dict
import numpy as np
from ..models.schemas import SmokeSimulationRequest, SmokeSimulationResponse

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "smoke_params.json"


def load_smoke_params() -> Dict[str, Any]:
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def simulate_smoke_dispersion(req: SmokeSimulationRequest) -> SmokeSimulationResponse:
    """
    Vectorized Gaussian-plume style smoke dispersion simulation.
    Strictly deterministic and physics-grounded:
    - Higher acres -> higher emission -> higher exposure index
    - Lower wind speed -> lower ventilation -> higher exposure index
    - Grid shape: 40x40 floats normalized between 0.0 and 1.0
    """
    params = load_smoke_params()
    all_params_verified = bool(
        params and all(item.get("verified", False) is True for item in params.values())
    )

    # Extract parameters from config with safe defaults
    ef = params.get("emission_factor_pm25_g_per_kg", {}).get("value", 6.3)
    yield_acre = params.get("straw_yield_kg_per_acre", {}).get("value", 2400.0)
    ay = params.get("dispersion_ay", {}).get("value", 0.32)
    az = params.get("dispersion_az", {}).get("value", 0.24)
    p = params.get("dispersion_power_p", {}).get("value", 0.78)
    q = params.get("dispersion_power_q", {}).get("value", 0.72)
    player_dist_m = params.get("player_distance_m", {}).get("value", 30.0)
    scale_player = params.get("index_scale_player", {}).get("value", 4.5)
    scale_village = params.get("index_scale_village", {}).get("value", 85.0)
    grid_size = int(params.get("grid_size", {}).get("value", 40))
    grid_extent_m = float(params.get("grid_extent_m", {}).get("value", 2000.0))

    # Total mass and emission rate (Q in g/s)
    total_biomass_kg = req.acres * yield_acre
    total_pm25_g = total_biomass_kg * ef
    burn_seconds = max(req.burn_minutes * 60.0, 1.0)
    q_emission = total_pm25_g / burn_seconds

    # Effective wind speed (min 0.2 m/s to prevent divide by zero)
    wind_u = max(req.wind_speed_ms, 0.2)

    # Wind direction in radians
    # Meteorological angle: 0 deg = blowing toward North (+Y), 90 deg = toward East (+X)
    theta = math.radians(req.wind_dir_deg)
    cos_theta = math.cos(theta)
    sin_theta = math.sin(theta)

    # 1. Player smoke concentration (evaluated at player distance downwind of the fire)
    sig_y_player = ay * (player_dist_m ** p)
    sig_z_player = az * (player_dist_m ** q)
    c_player = q_emission / (math.pi * wind_u * sig_y_player * sig_z_player)
    # Scaled to 0-100 index (concave mapping so it scales smoothly without saturation)
    player_exposure = 100.0 * (1.0 - math.exp(-scale_player * c_player))
    player_smoke_index = round(float(np.clip(player_exposure, 0.0, 100.0)), 2)

    # 2. Village smoke concentration
    # Village position relative to field: distance along line of sight
    d_v = max(req.distance_to_village_m, 10.0)
    # Compute downwind and crosswind projection at village
    x_v_down = d_v * cos_theta
    y_v_cross = -d_v * sin_theta

    if x_v_down > 0:
        sig_y_village = ay * (x_v_down ** p)
        sig_z_village = az * (x_v_down ** q)
        gauss_y = math.exp(- (y_v_cross ** 2) / (2.0 * max(sig_y_village ** 2, 1e-4)))
        c_village = (q_emission / (math.pi * wind_u * sig_y_village * sig_z_village)) * gauss_y
    else:
        # Village is upwind of the fire; isotropic near-field falloff
        upwind_dist = abs(x_v_down)
        c_village = (q_emission / (math.pi * wind_u * ay * az * 10.0)) * math.exp(-upwind_dist / 60.0)

    village_exposure = 100.0 * (1.0 - math.exp(-scale_village * c_village))
    village_smoke_index = round(float(np.clip(village_exposure, 0.0, 100.0)), 2)

    # 3. Vectorized 40x40 plume dispersion grid
    half_extent = grid_extent_m / 2.0
    lin_coords = np.linspace(-half_extent, half_extent, grid_size)
    grid_x, grid_y = np.meshgrid(lin_coords, lin_coords)

    # Rotate coordinates to downwind and crosswind axes
    x_down = grid_x * cos_theta + grid_y * sin_theta
    y_cross = -grid_x * sin_theta + grid_y * cos_theta

    # Calculate dispersion on grid
    x_eff = np.maximum(x_down, 5.0)
    sig_y_grid = ay * (x_eff ** p)
    sig_z_grid = az * (x_eff ** q)

    downwind_mask = x_down > 0
    concentration_grid = np.zeros_like(x_down, dtype=np.float64)

    # Downwind Gaussian plume
    c_down = (
        q_emission
        / (np.pi * wind_u * sig_y_grid * sig_z_grid)
        * np.exp(- (y_cross ** 2) / (2.0 * np.maximum(sig_y_grid ** 2, 1e-4)))
    )
    concentration_grid[downwind_mask] = c_down[downwind_mask]

    # Upwind decay
    upwind_mask = ~downwind_mask
    near_source_c = q_emission / (np.pi * wind_u * ay * az * 5.0 ** (p + q))
    c_up = near_source_c * np.exp(x_down[upwind_mask] / 40.0) * np.exp(- (y_cross[upwind_mask] ** 2) / 800.0)
    concentration_grid[upwind_mask] = c_up

    # Normalize grid to [0.0, 1.0]
    c_max = np.max(concentration_grid)
    if c_max > 0:
        normalized_grid = concentration_grid / c_max
    else:
        normalized_grid = np.zeros_like(concentration_grid)

    # Clip to [0.0, 1.0] and convert to Python list of lists
    normalized_grid = np.clip(normalized_grid, 0.0, 1.0)
    grid_list = [[round(float(val), 4) for val in row] for row in normalized_grid]

    return SmokeSimulationResponse(
        player_smoke_index=player_smoke_index,
        village_smoke_index=village_smoke_index,
        grid=grid_list,
        grid_size=grid_size,
        grid_extent_m=grid_extent_m,
        disclaimer="Modelled game estimate, not a measured air-quality reading.",
        all_params_verified=all_params_verified,
    )
