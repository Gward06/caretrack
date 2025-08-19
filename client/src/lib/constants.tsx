export const CARE_NOTE_CATEGORIES = [
  { value: "medication", label: "Medication", color: "bg-blue-100 text-blue-800" },
  { value: "care", label: "Personal Care", color: "bg-green-100 text-green-800" },
  { value: "mood", label: "Mood", color: "bg-purple-100 text-purple-800" },
  { value: "safety", label: "Safety", color: "bg-yellow-100 text-yellow-800" },
  { value: "meal", label: "Meal", color: "bg-orange-100 text-orange-800" },
  { value: "exercise", label: "Exercise", color: "bg-red-100 text-red-800" },
];

export const VISIT_STATUSES = [
  { value: "scheduled", label: "Scheduled", color: "bg-gray-100 text-gray-800" },
  { value: "in_progress", label: "In Progress", color: "bg-green-100 text-green-800" },
  { value: "completed", label: "Completed", color: "bg-blue-100 text-blue-800" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
];

export const SERVICE_TYPES = [
  { value: "personal_care", label: "Personal Care" },
  { value: "companionship", label: "Companionship" },
  { value: "medication", label: "Medication Assistance" },
  { value: "housekeeping", label: "Light Housekeeping" },
];

export const CARE_NOTE_TEMPLATES = {
  medication: [
    "Administered medication as prescribed",
    "Reminded patient to take medication",
    "Patient refused medication",
    "Side effects observed",
  ],
  care: [
    "Assisted with bathing",
    "Helped with dressing",
    "Supported mobility exercises",
    "Completed personal hygiene routine",
  ],
  mood: [
    "Patient in good spirits",
    "Patient seemed withdrawn",
    "Enjoyed conversation",
    "Expressed concerns about...",
  ],
  safety: [
    "Checked for safety hazards",
    "Assisted with fall prevention",
    "Reviewed emergency procedures",
    "Safety concern noted",
  ],
  meal: [
    "Prepared nutritious meal",
    "Assisted with feeding",
    "Patient ate well",
    "Dietary restrictions followed",
  ],
  exercise: [
    "Completed physical therapy exercises",
    "Went for a walk",
    "Did chair exercises",
    "Range of motion activities",
  ],
};
