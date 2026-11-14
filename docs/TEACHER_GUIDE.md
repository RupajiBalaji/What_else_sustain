# What Else Sustain: Teacher & Facilitator Guide 👨‍🏫🌾

This guide explains how educators, environmental science professors, and rural extension facilitators can run **What Else Sustain** in classrooms, college seminars, and community workshops.

---

## 1. Class Codes & Dashboard Overview (S12)

Teachers can create a designated class code to track aggregate learning impact, student decision paths, and pre/post quiz score changes across an entire cohort without collecting any personal identifiable information (PII).

### Creating a Class Code
1. Open the application and navigate to the **Teacher Dashboard** at `/teacher` (or tap **Class & Teacher Mode** from the in-game Settings Drawer).
2. Enter your **Class / Cohort Name** (e.g., *"Grade 9 Environmental Science - Sec B"* or *"Rural Youth Agriculture Camp"*).
3. Tap **Create Class Code**.
4. The system generates a clean, memorable 6-character code (e.g., `WES482`).
5. Share this code with your students via projector, chalkboard, or messaging group.

---

## 2. Student Flow & Privacy Guarantee

### How Students Join
- On launch or in the 3D Farm loading screen, students can enter the 6-character code in the **Class Code (Optional)** field.
- **Friendly Fallback**: Entering a class code is entirely optional. If a student forgets the code, miskeys it, or plays offline, they can tap **Play Directly** without interruption.

### Privacy-by-Design Architecture
- **Zero Login / Zero Personal Data**: No email addresses, phone numbers, student names, or passwords are ever requested or stored.
- **Anonymous Session IDs**: Each browser generates a randomized UUID. Telemetry tracks only game events (choices made, quiz answers, nature health balance).
- **Aggregated Export**: All data exported from the teacher dashboard is summarized at the class level.

---

## 3. Teacher Dashboard Features (`/teacher`)

The dashboard provides real-time analytics for your active class code:

1. **Active Student Count**: Live tally of students currently participating or completed.
2. **Average Nature Health**: Real-time mean ecosystem health percentage across all student runs.
3. **Straw Choice Distribution**: Visual breakdown of choices made at the harvest stubble dilemma:
   - Mistake Choice: Stubble Burning
   - Sustainable Option 1: Happy Seeder In-situ Mulching
   - Sustainable Option 2: Biomass Baler & Sale
   - Sustainable Option 3: Chopped Mulching
   - Sustainable Option 4: Bio-Decomposer Spray
4. **Pre vs Post Learning Delta**: Average percentage improvement in ecological concepts mastered between the pre-season check and the post-season review.
5. **Level Rank Distribution**: Count of students reaching *Seedling*, *Sapling*, *Tree*, and *Forest* ranks.
6. **One-Click CSV Export**: Tap **Download Class CSV** to export anonymous aggregate records for academic reporting or grant documentation.

---

## 4. Recommended 45-Minute Lesson Plan

| Time | Phase | Activity |
|:---:|:---:|:---|
| **00 - 05 min** | **Introduction** | Introduce the air pollution & agricultural dilemma: *Why do farmers burn stubble when winter approaches?* Share the class code. |
| **05 - 15 min** | **Phase 1: Make the Mistake** | Students enter the 3D village farm, experience the harvest, and make their first decision. Encourage them to try burning first to witness the real-world consequence: toxic PM2.5 plume reaching the village, air sensor spike, soil microbe loss. |
| **15 - 25 min** | **Phase 2: What Else?** | Students use the **What Else?** rewind button to explore sustainable alternatives (Happy Seeder, Bio-Decomposer, Biomass selling). |
| **25 - 35 min** | **Phase 3: Learning & Pledge** | Students complete the 5-question conceptual quiz, take a personal sustainability pledge, and generate their Eco-Champion honor card. |
| **35 - 45 min** | **Class Discussion & Review** | Open the `/teacher` dashboard on the classroom screen. Review the class health score, compare choices made, and discuss how rural mechanization subsidies make eco-choices viable. |

---

## 5. Offline & Low-Bandwidth Operation

- The 3D Farm runs smoothly on budget Android devices and school Chromebooks.
- For devices with software WebGL or older mobile hardware, the system automatically adapts to **Low Graphic Tier** or offers **Lite Mode**.
- Telemetry events queue locally in browser storage and seamlessly flush when network connectivity is restored.
