import React from 'react';
import { Newspaper, Building2, History, Sparkles, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  historyCount: number;
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  historyCount,
  onLoadSample,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white">
      {/* Top Banner / Empathy Bar */}
      <div className="bg-slate-900 px-4 py-1.5 text-xs text-slate-300 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded bg-blue-900/60 px-1.5 py-0.5 text-[11px] font-medium text-blue-200">
              <Building2 className="h-3 w-3" />
              지방자치단체 업무지원
            </span>
            <span className="hidden text-slate-400 sm:inline">|</span>
            <span className="text-[11px] text-slate-300">
              사업 담당 공무원을 위한 행정 홍보 실무 도구 (교육용 프로토타입)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-400">보안 안내: 개인정보 보호 준수 (가상 예시 적용)</span>
          </div>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm ring-4 ring-blue-50">
              <Newspaper className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  지역 보도자료 초안 생성기
                </h1>
                <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                  AI 어시스턴트
                </span>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-600 sm:text-base">
                사업 및 행사 정보를 입력하면 홍보형 보도자료 초안을 자동으로 작성합니다.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-blue-700 active:scale-95"
            title="교육 및 테스트를 위한 가상 데이터 자동 입력"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>예시 데이터 채우기</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="relative inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-blue-700 active:scale-95"
            title="이전에 작성한 보도자료 기록 확인"
          >
            <History className="h-3.5 w-3.5 text-slate-600" />
            <span>이전 보도자료</span>
            {historyCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
