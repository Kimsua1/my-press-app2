import React, { useState, useEffect } from 'react';
import {
  PressReleaseFormData,
  PressReleaseResult,
  SavedDraft,
} from './types';
import { SAMPLE_PRESS_RELEASE_DATA, EMPTY_FORM_DATA } from './sampleData';
import { Header } from './components/Header';
import { HistoryModal } from './components/HistoryModal';
import {
  Send,
  RotateCcw,
  Copy,
  Check,
  Download,
  RefreshCw,
  Sparkles,
  AlertCircle,
  FileText,
  FileCheck2,
  Info,
  Calendar,
  Building,
  Target,
  Users,
  Award,
  Lightbulb,
  Edit3,
  ExternalLink,
} from 'lucide-react';

const STORAGE_KEY = 'regional_press_release_drafts_v1';

export default function App() {
  const [formData, setFormData] = useState<PressReleaseFormData>(EMPTY_FORM_DATA);
  const [result, setResult] = useState<PressReleaseResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRegeneratingTitles, setIsRegeneratingTitles] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState<boolean>(false);

  // Draft History state
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedDrafts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load drafts from localStorage', e);
    }
  }, []);

  // Save history to localStorage
  const saveDraftToHistory = (
    form: PressReleaseFormData,
    res: PressReleaseResult
  ) => {
    try {
      const newDraft: SavedDraft = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        formData: { ...form },
        result: { ...res },
      };
      const updated = [newDraft, ...savedDrafts].slice(0, 30);
      setSavedDrafts(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save draft to localStorage', e);
    }
  };

  const handleInputChange = (
    field: keyof PressReleaseFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResultChange = (
    field: keyof PressReleaseResult,
    value: string
  ) => {
    setResult((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // Sample data quick fill
  const handleLoadSample = () => {
    setFormData(SAMPLE_PRESS_RELEASE_DATA);
    setErrorMessage(null);
  };

  // 1. 보도자료 생성
  const handleGenerate = async () => {
    // Basic check: at least one field should have content
    const hasAnyContent = Object.values(formData).some(
      (v) => v.trim().length > 0
    );
    if (!hasAnyContent) {
      setErrorMessage(
        '사업 및 행사 정보를 최소 1개 이상 입력해주세요. (상단의 [예시 데이터 채우기]를 클릭하면 편리하게 테스트할 수 있습니다.)'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data: PressReleaseResult = await response.json();
      setResult(data);
      saveDraftToHistory(formData, data);
      setCopiedNotification('보도자료가 성공적으로 생성되었습니다.');
      setTimeout(() => {
        setCopiedNotification(null);
      }, 3000);

      // Scroll smoothly to result on mobile
      setTimeout(() => {
        const resultSection = document.getElementById('result-section');
        if (resultSection && window.innerWidth < 1024) {
          resultSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error generating press release:', error);
      setErrorMessage(
        '보도자료를 생성하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 제목·부제목만 다시 생성 (선택 기능)
  const handleRegenerateTitles = async () => {
    if (!formData.projectName && !formData.eventName && !formData.content) {
      setErrorMessage('제목을 다시 생성하기 위한 사업 정보가 부족합니다.');
      return;
    }

    setIsRegeneratingTitles(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/regenerate-titles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate titles');
      }

      const data = await response.json();
      if (data.title && data.subtitle && result) {
        // Update title and subtitle, and reflect in fullPressRelease if applicable
        const updatedResult: PressReleaseResult = {
          ...result,
          title: data.title,
          subtitle: data.subtitle,
        };

        // Also replace title line in fullPressRelease if present
        let updatedFull = updatedResult.fullPressRelease;
        if (updatedFull.includes('제목:')) {
          updatedFull = updatedFull.replace(/제목:.*(\r?\n|$)/, `제목: ${data.title}\n`);
        }
        if (updatedFull.includes('부제:')) {
          updatedFull = updatedFull.replace(/부제:.*(\r?\n|$)/, `부제: ${data.subtitle}\n`);
        }
        updatedResult.fullPressRelease = updatedFull;

        setResult(updatedResult);
        saveDraftToHistory(formData, updatedResult);
        setCopiedNotification('새로운 제목과 부제목이 생성되어 적용되었습니다.');
        setTimeout(() => {
          setCopiedNotification(null);
        }, 3000);
      }
    } catch (error) {
      console.error('Error regenerating titles:', error);
      setErrorMessage(
        '보도자료를 생성하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setIsRegeneratingTitles(false);
    }
  };

  // Sync individual edits to full press release
  const handleSyncToFull = () => {
    if (!result) return;
    const synced = `[보도 일시] 2026년 10월 15일(목) 배포 즉시 가능

${result.departmentInfo}

제목: ${result.title}

부제: ${result.subtitle}

${result.lead}

□ 추진 배경 및 목적 (Why)
○ ${formData.projectName || '사업 추진'} 및 시민 공공 편익 증진
○ ${formData.emphasis || '주요 정책 목표 달성'}

□ 주요 행사 / 정책 내용 (What, When, Where, Who)
○ 일시·장소: ${formData.dateTimeLocation || '일시 및 장소'}
○ 대    상: ${formData.attendees || '시민 및 관계자'}
○ 주요내용: ${formData.content || '세부 추진 내용'}

□ 기대 효과 및 주요 성과 (How / Result)
○ ${result.outcomesSummary.replace(/\n/g, '\n○ ')}

[붙임] 관련 사진 또는 상세 자료 별첨 <끝>`;

    handleResultChange('fullPressRelease', synced);
    setCopiedNotification('개별 항목 수정 내용이 보도자료 전체에 반영되었습니다.');
    setTimeout(() => {
      setCopiedNotification(null);
    }, 2500);
  };

  // 3. 전체 복사
  const handleCopyFull = async () => {
    if (!result || !result.fullPressRelease) return;

    try {
      await navigator.clipboard.writeText(result.fullPressRelease);
      setCopiedNotification('보도자료 전체 내용이 복사되었습니다.');
      setTimeout(() => {
        setCopiedNotification(null);
      }, 3500);
    } catch (err) {
      console.error('Copy failed:', err);
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = result.fullPressRelease;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedNotification('보도자료 전체 내용이 복사되었습니다.');
      setTimeout(() => {
        setCopiedNotification(null);
      }, 3500);
    }
  };

  // 4. 초기화
  const handleReset = () => {
    if (
      Object.values(formData).some((v) => v.trim().length > 0) ||
      result !== null
    ) {
      const confirmReset = window.confirm(
        '입력한 내용과 생성된 보도자료 결과가 모두 초기화됩니다. 계속하시겠습니까?'
      );
      if (!confirmReset) return;
    }
    setFormData(EMPTY_FORM_DATA);
    setResult(null);
    setErrorMessage(null);
    setCopiedNotification(null);
  };

  // 5. TXT 다운로드 (선택 기능)
  const handleDownload = () => {
    if (!result) return;
    const element = document.createElement('a');
    const file = new Blob([result.fullPressRelease], {
      type: 'text/plain;charset=utf-8',
    });
    element.href = URL.createObjectURL(file);
    const cleanTitle = (result.title || formData.projectName || '보도자료_초안')
      .replace(/[^\w\s가-힣-]/g, '')
      .trim()
      .slice(0, 30);
    element.download = `[보도자료]_${cleanTitle}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Draft History handlers
  const handleLoadDraft = (draft: SavedDraft) => {
    setFormData(draft.formData);
    setResult(draft.result);
    setErrorMessage(null);
  };

  const handleDeleteDraft = (id: string) => {
    const updated = savedDrafts.filter((d) => d.id !== id);
    setSavedDrafts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleClearAllDrafts = () => {
    if (window.confirm('저장된 모든 보도자료 기록을 삭제하시겠습니까?')) {
      setSavedDrafts([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
      <Header
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={savedDrafts.length}
        onLoadSample={handleLoadSample}
      />

      {/* Toast Notification for Clipboard Copy */}
      {copiedNotification && (
        <div className="fixed top-5 left-1/2 z-50 -translate-x-1/2 transform transition-all animate-bounce">
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl ring-2 ring-blue-500">
            <Check className="h-5 w-5 text-emerald-400" />
            <span>{copiedNotification}</span>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Error message alert */}
        {errorMessage && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-xs">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div className="flex-1 text-sm font-medium leading-relaxed">
              {errorMessage}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs font-semibold text-red-600 underline hover:text-red-800"
            >
              닫기
            </button>
          </div>
        )}

        {/* Process Guide Bar */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1 font-semibold text-slate-800">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                !
              </span>
              <span>작성 흐름 안내:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">
                ① 사업 및 행사 정보 입력 (8개 항목)
              </span>
              <span className="text-slate-300">➔</span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                ② [보도자료 생성] 클릭
              </span>
              <span className="text-slate-300">➔</span>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                ③ 결과 항목별 확인 및 직접 수정
              </span>
              <span className="text-slate-300">➔</span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
                ④ [전체 복사] 후 배포
              </span>
            </div>
          </div>
        </div>

        {/* Split Grid: Left Input Section, Right Result Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ======================= 1. INPUT AREA (5 cols) ======================= */}
          <section className="lg:col-span-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              {/* Input Area Header */}
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-700 text-xs font-bold text-white">
                    1
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    사업 및 행사 정보 입력
                  </h2>
                </div>
                <span className="text-xs text-slate-500">8개 입력 항목</span>
              </div>

              {/* Form Fields */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGenerate();
                }}
                className="space-y-4 text-sm"
              >
                {/* 1. 사업명 */}
                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-blue-600" />
                      1. 사업명
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      공식 추진 정책·사업 명칭
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.projectName}
                    onChange={(e) =>
                      handleInputChange('projectName', e.target.value)
                    }
                    placeholder="예: 2026년 시민 디지털 역량 강화 사업"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                  />
                </div>

                {/* 2. 행사명 */}
                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      2. 행사명
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      세부 행사 또는 프로그램명
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.eventName}
                    onChange={(e) =>
                      handleInputChange('eventName', e.target.value)
                    }
                    placeholder="예: 시민 스마트폰 활용 교육"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                  />
                </div>

                {/* 3. 일시·장소 */}
                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      3. 일시·장소
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      행사 개최 일시 및 구체적 장소
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.dateTimeLocation}
                    onChange={(e) =>
                      handleInputChange('dateTimeLocation', e.target.value)
                    }
                    placeholder="예: 2026년 10월 15일 오후 2시 / ○○시 평생학습관"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                  />
                </div>

                {/* 4. 사업/행사 내용 (여러 줄) */}
                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-blue-600" />
                      4. 사업/행사 내용
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      추진 배경, 운영 방식, 교육 내용 등
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.content}
                    onChange={(e) =>
                      handleInputChange('content', e.target.value)
                    }
                    placeholder="예: 시민 50명을 대상으로 스마트폰 기본 활용법과 생활에 필요한 디지털 서비스를 교육하는 프로그램을 운영하였다. 교육은 4주 동안 진행되었다."
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                  />
                </div>

                {/* 5. 주요 성과 (여러 줄) */}
                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-blue-600" />
                      5. 주요 성과
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      수료 인원, 만족도, 주민 혜택 등
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.outcomes}
                    onChange={(e) =>
                      handleInputChange('outcomes', e.target.value)
                    }
                    placeholder="예: 시민 50명이 교육을 수료했으며, 교육 참여자들의 스마트폰 활용 능력 향상에 도움이 되었다."
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                  />
                </div>

                {/* 6. 참석자 */}
                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-600" />
                      6. 참석자
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      참여 대상 및 참석 인원
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.attendees}
                    onChange={(e) =>
                      handleInputChange('attendees', e.target.value)
                    }
                    placeholder="예: 시민 50명 및 관계자"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                  />
                </div>

                {/* 7. 담당부서 */}
                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-blue-600" />
                      7. 담당부서
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      시·군·구 주관 부서명
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      handleInputChange('department', e.target.value)
                    }
                    placeholder="예: ○○시 평생교육과"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                  />
                </div>

                {/* 8. 강조하고 싶은 내용 (여러 줄) */}
                <div>
                  <label className="mb-1 flex items-center justify-between font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      8. 강조하고 싶은 내용
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      핵심 홍보 메시지 및 시사점
                    </span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.emphasis}
                    onChange={(e) =>
                      handleInputChange('emphasis', e.target.value)
                    }
                    placeholder="예: 시민들이 일상생활에서 디지털 서비스를 보다 편리하게 이용할 수 있도록 지원했다는 점을 강조한다."
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                  />
                </div>

                {/* Required Action Buttons: [보도자료 생성] [초기화] */}
                <div className="pt-4">
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-base font-bold text-white shadow-md transition hover:bg-blue-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-blue-400"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          <span>보도자료 생성 중...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 text-blue-200" />
                          <span>보도자료 생성</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-red-700 disabled:opacity-50"
                      title="입력 내용과 생성된 보도자료를 모두 비웁니다"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>초기화</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </section>

          {/* ======================= 2. RESULT AREA (7 cols) ======================= */}
          <section id="result-section" className="lg:col-span-7">
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              {/* Result Area Header */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-700 text-xs font-bold text-white">
                    2
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      보도자료 생성 결과 및 직접 수정
                    </h2>
                  </div>
                </div>

                {/* Sub-actions when result is available */}
                {result && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRegenerateConfirm(true)}
                      disabled={isLoading || isRegeneratingTitles}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-blue-700 active:scale-95 disabled:opacity-50"
                      title="처음 입력한 8개 정보를 기준으로 새로운 보도자료 전체를 다시 생성합니다"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
                      />
                      <span>{isLoading ? '보도자료 다시 생성 중...' : '보도자료 다시 생성'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                      title="텍스트 문서(.txt)로 저장"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>다운로드</span>
                    </button>
                  </div>
                )}
              </div>

              {/* State 1: Loading */}
              {isLoading ? (
                <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
                  <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <RefreshCw className="h-7 w-7 animate-spin text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    홍보형 지자체 보도자료 초안을 작성하고 있습니다
                  </h3>
                  <p className="mt-1 max-w-md text-xs text-slate-500">
                    입력된 사업 및 행사 정보를 분석하여 두괄식 제목, 리드문, 행정 격식체 본문,
                    표준 업무 양식 틀을 결합하고 있습니다. 잠시만 기다려주세요.
                  </p>
                  <div className="mt-6 flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                    <span>Gemini AI 행정 보도자료 엔진 가동 중</span>
                  </div>
                </div>
              ) : !result ? (
                /* State 2: Empty Placeholder */
                <div className="flex flex-1 flex-col items-center justify-center py-16 text-center text-slate-500">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    작성된 보도자료가 아직 없습니다
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
                    좌측의 8개 항목을 입력한 뒤{' '}
                    <span className="font-semibold text-blue-700">[보도자료 생성]</span> 버튼을
                    누르면 언론 홍보에 최적화된 지방자치단체 표준 양식의 초안이 이 곳에 작성됩니다.
                  </p>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>가상 예시 데이터 불러오기</span>
                  </button>

                  <div className="mt-8 w-full max-w-md rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-left">
                    <div className="text-xs font-semibold text-slate-700">
                      💡 생성되는 7개 결과 항목
                    </div>
                    <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
                      <li>• 1. 제목 (두괄식 눈에 띄는 헤드라인)</li>
                      <li>• 2. 부제목 (본문 보충 1~2줄)</li>
                      <li>• 3. 리드문 (핵심 요약)</li>
                      <li>• 4. 본문 (지자체 공식 격식체)</li>
                      <li>• 5. 주요 성과 요약 (성과 및 파급효과)</li>
                      <li>• 6. 담당부서 (부서 및 담당자)</li>
                      <li>• 7. 보도자료 전체 (기존 표준 업무 양식 완결본)</li>
                    </ul>
                  </div>
                </div>
              ) : (
                /* State 3: Generated Result in Exact Required Order */
                <div className="flex-1 space-y-5">
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                    <span className="flex items-center gap-1.5">
                      <FileCheck2 className="h-4 w-4 text-emerald-600" />
                      각 항목을 화면에서 직접 자유롭게 수정할 수 있습니다.
                    </span>
                    <span className="text-[11px] text-emerald-600 font-normal">
                      직접 편집 가능
                    </span>
                  </div>

                  {/* 1. 제목 */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition focus-within:border-blue-500 focus-within:bg-white">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                          1
                        </span>
                        제목 (Title)
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRegenerateTitles}
                          disabled={isRegeneratingTitles || isLoading}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 shadow-2xs transition hover:bg-blue-100 hover:text-blue-800 active:scale-95 disabled:opacity-50"
                          title="기존 8개 입력 정보를 다시 전달하여 새로운 제목과 부제목을 생성합니다"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${isRegeneratingTitles ? 'animate-spin text-blue-600' : 'text-blue-600'}`}
                          />
                          <span>
                            {isRegeneratingTitles
                              ? '제목·부제목 생성 중...'
                              : '제목·부제목 다시 생성'}
                          </span>
                        </button>
                        <span className="text-[11px] text-slate-400">
                          {result.title.length}자
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Edit3 className="h-3 w-3" />
                          직접 수정 가능
                        </span>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={result.title}
                      onChange={(e) => handleResultChange('title', e.target.value)}
                      className="w-full resize-y rounded-lg border border-slate-300 bg-white p-2.5 text-base font-bold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                      placeholder="두괄식 명확한 제목"
                    />
                  </div>

                  {/* 2. 부제목 */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition focus-within:border-blue-500 focus-within:bg-white">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                            2
                          </span>
                          부제목 (Subtitle)
                        </label>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          (「제목·부제목 다시 생성」 클릭 시 함께 갱신됩니다)
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Edit3 className="h-3 w-3" />
                        직접 수정 가능
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={result.subtitle}
                      onChange={(e) =>
                        handleResultChange('subtitle', e.target.value)
                      }
                      className="w-full resize-y rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-medium text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                      placeholder="본문 내용을 보충하는 1~2줄 부가 설명"
                    />
                  </div>

                  {/* 3. 리드문 */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition focus-within:border-blue-500 focus-within:bg-white">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                          3
                        </span>
                        리드문 (Lead Paragraph)
                      </label>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Edit3 className="h-3 w-3" />
                        수정 가능
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={result.lead}
                      onChange={(e) => handleResultChange('lead', e.target.value)}
                      className="w-full resize-y rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 leading-relaxed focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                      placeholder="보도자료의 핵심 내용을 요약하는 문단"
                    />
                  </div>

                  {/* 4. 본문 */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition focus-within:border-blue-500 focus-within:bg-white">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                          4
                        </span>
                        본문 (Body Text)
                      </label>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Edit3 className="h-3 w-3" />
                        수정 가능
                      </span>
                    </div>
                    <textarea
                      rows={6}
                      value={result.body}
                      onChange={(e) => handleResultChange('body', e.target.value)}
                      className="w-full resize-y rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 leading-relaxed focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                      placeholder="지방자치단체 공식 문체로 작성된 상세 본문"
                    />
                  </div>

                  {/* 5. 주요 성과 요약 */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition focus-within:border-blue-500 focus-within:bg-white">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                          5
                        </span>
                        주요 성과 요약 (Outcomes Summary)
                      </label>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Edit3 className="h-3 w-3" />
                        수정 가능
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={result.outcomesSummary}
                      onChange={(e) =>
                        handleResultChange('outcomesSummary', e.target.value)
                      }
                      className="w-full resize-y rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 leading-relaxed focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                      placeholder="주요 성과 및 파급효과 요약"
                    />
                  </div>

                  {/* 6. 담당부서 */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition focus-within:border-blue-500 focus-within:bg-white">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">
                          6
                        </span>
                        담당부서 (Department & Contact)
                      </label>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Edit3 className="h-3 w-3" />
                        수정 가능
                      </span>
                    </div>
                    <input
                      type="text"
                      value={result.departmentInfo}
                      onChange={(e) =>
                        handleResultChange('departmentInfo', e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                      placeholder="담당 부서 및 담당자 연락처"
                    />
                  </div>

                  {/* 7. 보도자료 전체 */}
                  <div className="rounded-xl border-2 border-blue-200 bg-blue-50/20 p-4 transition focus-within:border-blue-600 focus-within:bg-white">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          7
                        </span>
                        <h4 className="text-sm font-black text-blue-950">
                          보도자료 전체 (기존 공공기관 공식 업무 양식)
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSyncToFull}
                          className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-blue-700 shadow-2xs border border-blue-200 hover:bg-blue-50"
                          title="위 1~6번 항목의 수정 내용을 아래 전체 서식에 자동으로 반영합니다"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>개별 수정 내용 전체에 반영</span>
                        </button>
                        <span className="rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-blue-700 shadow-2xs border border-blue-100">
                          배포용 표준 서식 완결본
                        </span>
                      </div>
                    </div>

                    <p className="mb-2 text-[11px] text-slate-500">
                      공식 양식 틀([보도 일시], [담당 부서], □ 추진 배경, □ 주요 행사 내용, □ 기대 효과, [붙임] &lt;끝&gt;)이 포함된 최종 원본입니다. 자유롭게 직접 수정할 수 있습니다.
                    </p>

                    <textarea
                      rows={14}
                      value={result.fullPressRelease}
                      onChange={(e) =>
                        handleResultChange('fullPressRelease', e.target.value)
                      }
                      className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm leading-relaxed text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden"
                      placeholder="공식 업무 양식 전체 내용"
                    />
                  </div>

                  {/* Required Result Area Action: [전체 복사] Button */}
                  <div className="sticky bottom-4 z-10 pt-2">
                    <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-md">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="hidden text-xs text-slate-600 sm:block">
                          💡 복사 후 한글(HWP), 워드, 메일 등에 바로 붙여넣어 배포할 수 있습니다.
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyFull}
                          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.99]"
                        >
                          <Copy className="h-5 w-5" />
                          <span>전체 복사</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Confirmation Modal for Regenerating Entire Press Release */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-slate-900">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  보도자료를 다시 생성하시겠습니까?
                </h3>
                <p className="text-xs text-slate-500">
                  기존에 입력한 8개 정보를 기준으로 새롭게 작성합니다.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 leading-relaxed">
              <div className="font-bold text-amber-950 mb-1 flex items-center gap-1">
                <span>⚠️</span>
                <span>기존 수정 내용 대체 안내</span>
              </div>
              보도자료를 다시 생성하면 화면에서 직접 수정한 기존 결과(제목, 부제목, 리드문, 본문, 주요 성과, 담당부서, 보도자료 전체)가 <strong className="font-bold text-amber-950 underline decoration-amber-500">새로운 AI 생성 결과로 모두 대체</strong>됩니다.
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowRegenerateConfirm(false)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRegenerateConfirm(false);
                  handleGenerate();
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-800 active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>보도자료 다시 생성</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedDrafts={savedDrafts}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={handleDeleteDraft}
        onClearAllDrafts={handleClearAllDrafts}
      />
    </div>
  );
}
