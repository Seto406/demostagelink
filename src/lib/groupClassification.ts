import { schools } from "@/data/schools";

const universityKeywords = [
  "university",
  "college",
  "institute",
  "polytechnic",
  "pamantasan",
  "state university",
  "state college",
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const normalizedSchoolNames = schools.map((school) => normalize(school));

export const isUniversityTheaterGroup = (groupName: string): boolean => {
  const normalizedGroupName = normalize(groupName);
  if (!normalizedGroupName) return false;

  if (universityKeywords.some((keyword) => normalizedGroupName.includes(keyword))) {
    return true;
  }

  return normalizedSchoolNames.some((schoolName) => normalizedGroupName.includes(schoolName));
};
