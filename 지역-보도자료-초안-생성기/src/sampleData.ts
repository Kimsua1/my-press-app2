import { PressReleaseFormData } from './types';

export const SAMPLE_PRESS_RELEASE_DATA: PressReleaseFormData = {
  projectName: '2026년 시민 디지털 역량 강화 사업',
  eventName: '시민 스마트폰 활용 교육',
  dateTimeLocation: '2026년 10월 15일 오후 2시 / ○○시 평생학습관',
  content: '시민 50명을 대상으로 스마트폰 기본 활용법과 생활에 필요한 디지털 서비스를 교육하는 프로그램을 운영하였다. 교육은 4주 동안 진행되었다.',
  outcomes: '시민 50명이 교육을 수료했으며, 교육 참여자들의 스마트폰 활용 능력 향상에 도움이 되었다.',
  attendees: '시민 50명 및 관계자',
  department: '○○시 평생교육과',
  emphasis: '시민들이 일상생활에서 디지털 서비스를 보다 편리하게 이용할 수 있도록 지원했다는 점을 강조한다.',
};

export const EMPTY_FORM_DATA: PressReleaseFormData = {
  projectName: '',
  eventName: '',
  dateTimeLocation: '',
  content: '',
  outcomes: '',
  attendees: '',
  department: '',
  emphasis: '',
};
