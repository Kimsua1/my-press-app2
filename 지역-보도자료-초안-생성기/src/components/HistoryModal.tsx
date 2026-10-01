import React from 'react';
import { SavedDraft } from '../types';
import { Clock, Trash2, ArrowUpRight, X } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedDrafts: SavedDraft[];
  onLoadDraft: (draft: SavedDraft) => void;
  onDeleteDraft: (id: string) => void;
  onClearAllDrafts: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  savedDrafts,
  onLoadDraft,
  onDeleteDraft,
  onClearAllDrafts,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-700" />
            <h3 className="text-lg font-bold text-slate-800">
              이전에 작성한 보도자료 보관함
            </h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
              {savedDrafts.length}건
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {savedDrafts.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Clock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium">저장된 보도자료 초안이 없습니다.</p>
              <p className="mt-1 text-xs text-slate-400">
                보도자료를 생성하면 자동으로 브라우저 보관함에 안전하게 저장됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="group relative flex items-start justify-between rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-400 hover:shadow-xs"
                >
                  <div
                    onClick={() => {
                      onLoadDraft(draft);
                      onClose();
                    }}
                    className="flex-1 cursor-pointer pr-4"
                  >
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-blue-700">
                        {draft.formData.department || '부서 미지정'}
                      </span>
                      <span>•</span>
                      <span>{new Date(draft.createdAt).toLocaleString('ko-KR')}</span>
                    </div>
                    <h4 className="mt-1 font-bold text-slate-900 line-clamp-1 group-hover:text-blue-700">
                      {draft.result.title || draft.formData.projectName || '제목 없음'}
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-600 line-clamp-1">
                      {draft.result.subtitle || draft.formData.eventName || '내용 없음'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onLoadDraft(draft);
                        onClose();
                      }}
                      className="flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <span>불러오기</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDraft(draft.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {savedDrafts.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
            <button
              onClick={onClearAllDrafts}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              전체 기록 삭제
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
