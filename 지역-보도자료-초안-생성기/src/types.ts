export interface PressReleaseFormData {
  projectName: string;       // 1. 사업명
  eventName: string;         // 2. 행사명
  dateTimeLocation: string;  // 3. 일시·장소
  content: string;           // 4. 사업/행사 내용
  outcomes: string;          // 5. 주요 성과
  attendees: string;         // 6. 참석자
  department: string;        // 7. 담당부서
  emphasis: string;          // 8. 강조하고 싶은 내용
}

export interface PressReleaseResult {
  title: string;             // 1. 제목
  subtitle: string;          // 2. 부제목
  lead: string;              // 3. 리드문
  body: string;              // 4. 본문
  outcomesSummary: string;   // 5. 주요 성과 요약
  departmentInfo: string;    // 6. 담당부서
  fullPressRelease: string;  // 7. 보도자료 전체
}

export interface SavedDraft {
  id: string;
  createdAt: string;
  formData: PressReleaseFormData;
  result: PressReleaseResult;
}
