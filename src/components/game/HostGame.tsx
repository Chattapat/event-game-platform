"use client";

import { GameVisual } from "@/components/game/GameVisual";
import { useQuestionCountdown } from "@/components/game/use-question-countdown";
import { useGameSocket } from "@/components/game/use-game-socket";
import { choiceStyles } from "@/lib/choice-styles";
import {
  getHostActionAvailability,
  getRecommendedHostAction,
} from "@/lib/host-action-availability";
import type { HostActionType } from "@/types/game";
import QRCode from "qrcode";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface HostGameProps {
  gameId: string;
  hostKey: string;
}

function getJoinUrl(gameId: string): string {
  if (typeof window === "undefined") {
    return `/play/${gameId}`;
  }

  return `${window.location.origin}/play/${gameId}`;
}

export function HostGame({ gameId, hostKey }: HostGameProps) {
  const router = useRouter();
  const { snapshot, errorMessage, sendAction } = useGameSocket({
    gameId,
    role: "host",
    hostKey,
  });
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [fullscreenQuestionId, setFullscreenQuestionId] = useState<
    string | null
  >(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const question = snapshot?.currentQuestion ?? null;
  const isVisualFullscreen = fullscreenQuestionId === question?.id;
  const joinUrl = getJoinUrl(gameId);
  const isRevealed = snapshot?.status === "revealed";
  const remainingSeconds = useQuestionCountdown({
    endsAtMs: snapshot?.questionEndsAtMs ?? null,
    isActive: snapshot?.status === "accepting-answers",
  });

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(joinUrl, {
      errorCorrectionLevel: "H",
      margin: 1,
      scale: 8,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  useEffect(() => {
    if (!isVisualFullscreen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFullscreenQuestionId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisualFullscreen]);

  useEffect(() => {
    if (snapshot?.status !== "finished") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.push(
        `/teacher/${gameId}/finished?key=${encodeURIComponent(hostKey)}`,
      );
    }, 3500);

    return () => window.clearTimeout(timeoutId);
  }, [gameId, hostKey, router, snapshot?.status]);

  const sendHostAction = (type: HostActionType) => {
    if (type === "reset-game") {
      setIsResetConfirmOpen(true);
      return;
    }

    sendAction({ type });
  };

  const confirmResetGame = () => {
    setIsResetConfirmOpen(false);
    sendAction({ type: "reset-game" });
  };

  const copyJoinUrl = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1200);
    } catch {
      setCopyStatus("idle");
    }
  };

  const isAcceptingAnswers = snapshot?.status === "accepting-answers";
  const questionStatusText =
    snapshot?.status === "accepting-answers"
      ? "เปิดรับคำตอบ"
      : snapshot?.status === "closed-answers"
        ? "ปิดรับคำตอบ"
        : snapshot?.status === "revealed"
          ? "เฉลยแล้ว"
          : snapshot?.status === "finished"
            ? "จบเกม"
            : "รอคำถาม";
  const countdownToneClass =
    (remainingSeconds ?? 0) <= 5 ? "text-rose-600" : "text-sky-600";
  const currentQuestionNumber = snapshot?.currentQuestionNumber ?? 0;
  const recommendedAction = getRecommendedHostAction(
    snapshot?.status ?? "waiting",
  );
  const hostActions: Array<{
    type: HostActionType;
    label: string;
    toneClassName: string;
  }> = [
    {
      type: "start-question",
      label: "Start",
      toneClassName:
        "liquid-button border border-sky-200/80 bg-sky-200/80 text-sky-950 hover:bg-sky-300/80",
    },
    {
      type: "close-answers",
      label: "Close",
      toneClassName: "liquid-control hover:bg-white/55",
    },
    {
      type: "reveal-answer",
      label: "Reveal",
      toneClassName:
        "liquid-button border border-emerald-200/80 bg-emerald-200/80 text-emerald-950 hover:bg-emerald-300/80",
    },
    {
      type: "next-question",
      label: "Next",
      toneClassName:
        "liquid-button border border-indigo-200/80 bg-indigo-200/80 text-indigo-950 hover:bg-indigo-300/80",
    },
    {
      type: "reset-game",
      label: "Reset",
      toneClassName:
        "liquid-button border border-rose-200/80 bg-rose-200/80 text-rose-950 hover:bg-rose-300/80",
    },
  ];

  return (
    <main className="liquid-bg min-h-screen overflow-x-hidden p-3 text-slate-900 xl:h-screen xl:overflow-hidden">
      <div className="page-shell grid min-h-[calc(100vh-1.5rem)] grid-cols-1 gap-3 xl:h-full xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="liquid-panel grid min-h-[720px] grid-rows-[auto_minmax(0,1fr)_auto] gap-3 overflow-hidden rounded-[2rem] p-4 xl:min-h-0 xl:p-5">
          <header className="flex min-h-0 flex-wrap items-start justify-between gap-3">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black uppercase tracking-[0.24em] text-sky-500">
                  Teacher Control
                </p>
                <span className="glass-chip rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                  Room {gameId}
                </span>
                <span className="glass-chip rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
                  12 Questions
                </span>
              </div>
              <h1 className="max-w-5xl text-3xl font-extrabold leading-tight tracking-tight text-slate-900 2xl:text-5xl">
                {question?.title ?? "รอเริ่มเกม"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-600">
                <span className="glass-chip rounded-full px-3 py-2">
                  {snapshot?.message ?? "กำลังเชื่อมต่อ"}
                </span>
              </div>
            </div>
            <div className="grid min-w-[220px] grid-cols-2 gap-2 self-stretch">
              <div className="liquid-control rounded-3xl px-4 py-4 text-right">
                <p className="text-sm font-bold text-slate-500">คนตอบแล้ว</p>
                <p className="text-4xl font-black text-sky-600 2xl:text-5xl">
                  {snapshot?.answeredCount ?? 0}
                </p>
              </div>
              <div className="liquid-control rounded-3xl px-4 py-4 text-right">
                <p className="text-sm font-bold text-slate-500">เวลา</p>
                <p
                  className={`text-4xl font-black 2xl:text-5xl ${countdownToneClass}`}
                >
                  {remainingSeconds ?? "-"}
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                  seconds
                </p>
              </div>
            </div>
          </header>

          <GameVisual
            question={question}
            isRevealed={isRevealed}
            onOpenFullscreen={
              question ? () => setFullscreenQuestionId(question.id) : undefined
            }
          />

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {question?.choices.map((choice) => {
              const choiceResult = snapshot?.results.find(
                (result) => result.choiceId === choice.id,
              );
              const hasResult = choiceResult != null;
              return (
                <div
                  key={choice.id}
                  className={`liquid-button rounded-3xl border px-4 py-4 text-lg font-black sm:px-5 xl:text-2xl 2xl:text-3xl ${choiceStyles[choice.id].panelClassName}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center">
                      <span className="mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/30 text-center text-lg">
                        {choice.id}
                      </span>
                      <span className="truncate">{choice.text}</span>
                      {isRevealed && choiceResult?.isCorrect ? (
                        <span className="ml-3 shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-700">
                          คำตอบถูก
                        </span>
                      ) : null}
                    </div>
                    {hasResult ? (
                      <div className="shrink-0 text-3xl font-black 2xl:text-4xl">
                        {choiceResult.percentage}%
                      </div>
                    ) : null}
                  </div>
                  {hasResult ? (
                    <div className="mt-3">
                      <div className="h-2 overflow-hidden rounded-full bg-white/50">
                        <div
                          className={`h-full transition-[width] duration-500 ease-out ${isRevealed && choiceResult.isCorrect ? "bg-emerald-500" : choiceStyles[choice.id].barClassName}`}
                          style={{ width: `${choiceResult.percentage}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="liquid-panel relative flex min-h-0 flex-col gap-3 overflow-y-auto rounded-[2rem] p-4 text-slate-900">
          <div className="shrink-0">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">
              Session
            </p>
            <p className="mt-1 text-2xl font-extrabold">ส่วนควบคุมเกมส์</p>
            <p className="mt-1 text-sm text-slate-500">
              ใช้ส่วนนี้สำหรับเปิดคำถาม ปิดรับคำตอบ และเฉลย
            </p>
            {errorMessage ? (
              <p className="mt-2 rounded-md bg-red-50 p-3 text-sm font-semibold text-danger">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="liquid-control shrink-0 rounded-3xl p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-500">
                ให้ผู้เล่นเข้าเกม
              </p>
              <span className="rounded-full bg-white/60 px-2 py-1 text-xs font-bold text-slate-600">
                Student Play
              </span>
            </div>
            <div className="my-3 rounded-3xl border border-dashed border-white/60 bg-white/35 p-4">
              <p className="text-base font-black text-slate-700">
                เปิดลิงก์นี้บนมือถือหรือแท็บเล็ต
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                สแกน QR หรือคัดลอกลิงก์ด้านล่าง
              </p>
              <div className="mt-3 flex items-center justify-center rounded-3xl bg-white p-3">
                {qrDataUrl ? (
                  <Image
                    alt="QR code for player join URL"
                    className="h-44 w-44 rounded-2xl"
                    height={176}
                    src={qrDataUrl}
                    width={176}
                  />
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center rounded-2xl bg-slate-100 text-center text-sm font-bold text-slate-500">
                    Generating QR...
                  </div>
                )}
              </div>
              <div className="mt-3 break-all rounded-2xl bg-white/60 px-3 py-2 text-center text-sm font-semibold text-slate-800">
                {joinUrl}
              </div>
              <button
                className="action-button mt-3 w-full border border-sky-200/70 bg-sky-100 px-4 py-3 text-sm font-black text-sky-900 hover:bg-sky-200"
                type="button"
                onClick={copyJoinUrl}
              >
                {copyStatus === "copied" ? "คัดลอกแล้ว" : "คัดลอก URL"}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-500">
              ผู้เล่นที่เชื่อมต่อ: {snapshot?.playerCount ?? 0}
            </p>
          </div>

          <div className="liquid-control shrink-0 rounded-3xl p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-500">สถานะคำถาม</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${isAcceptingAnswers ? "bg-sky-100 text-sky-700" : "bg-white/70 text-slate-600"}`}
              >
                {questionStatusText}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/55">
              <div
                className={`h-full transition-[width] duration-300 ease-linear ${remainingSeconds != null && remainingSeconds <= 5 ? "countdown-bar-danger" : "countdown-bar"}`}
                style={{
                  width:
                    snapshot?.questionDurationMs && remainingSeconds != null
                      ? `${Math.max(0, (remainingSeconds / (snapshot.questionDurationMs / 1000)) * 100)}%`
                      : "0%",
                }}
              />
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              รอบละ 15 วินาที และผู้เล่นตอบได้เพียง 1 ครั้ง
            </p>
          </div>

          <div className="liquid-control shrink-0 rounded-3xl p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-500">ควบคุมเกม</p>
              {recommendedAction ? (
                <span className="rounded-full bg-white/65 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                  Next step:{" "}
                  {
                    hostActions.find(
                      (action) => action.type === recommendedAction,
                    )?.label
                  }
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {hostActions.map((action) => {
                const availability = getHostActionAvailability(
                  snapshot?.status ?? "waiting",
                  action.type,
                  currentQuestionNumber,
                );
                const isRecommended = recommendedAction === action.type;
                return (
                  <button
                    key={action.type}
                    className={`action-button px-3 py-3 ${action.toneClassName} ${isRecommended ? "ring-2 ring-white/80" : ""}`}
                    disabled={!availability.enabled}
                    type="button"
                    onClick={() => sendHostAction(action.type)}
                  >
                    <div className="text-base font-black sm:text-lg">
                      {action.label}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold opacity-75">
                      {availability.helperText}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="liquid-control shrink-0 rounded-3xl p-3 text-sm font-semibold text-slate-500">
            <p>
              ข้อ {snapshot?.currentQuestionNumber ?? 0} /{" "}
              {snapshot?.totalQuestions ?? 0}
            </p>
            <p>Game ID: {gameId}</p>
          </div>
        </aside>
      </div>
      {isVisualFullscreen && question ? (
        <div
          aria-label="ดูภาพคำถามเต็มจอ"
          aria-modal="true"
          className="fixed inset-0 z-50 flex bg-slate-950/80 p-3 backdrop-blur-xl sm:p-5"
          role="dialog"
        >
          <button
            aria-label="ปิดภาพเต็มจอ"
            className="absolute inset-0 cursor-default"
            type="button"
            onClick={() => setFullscreenQuestionId(null)}
          />
          <div className="relative z-10 grid h-full w-full grid-rows-[auto_minmax(0,1fr)] gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="glass-chip rounded-full px-4 py-2 text-sm font-black text-slate-700 sm:text-base">
                {question.title}
              </div>
              <button
                className="glass-chip min-h-11 rounded-full px-5 py-2 text-sm font-black text-slate-800 transition hover:bg-white/75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80"
                type="button"
                onClick={() => setFullscreenQuestionId(null)}
              >
                ปิด
              </button>
            </div>
            <GameVisual
              question={question}
              isFullscreen
              isRevealed={isRevealed}
            />
          </div>
        </div>
      ) : null}
      {isResetConfirmOpen ? (
        <div
          aria-label="ยืนยันการเริ่มใหม่"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md"
          role="dialog"
        >
          <div className="liquid-panel w-full max-w-md rounded-[2rem] p-5 text-center text-slate-900">
            <h2 className="text-2xl font-black">ยืนยันการเริ่มใหม่</h2>
            <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
              การ Reset จะล้างสถานะเกม คำตอบ และเริ่มใหม่ตั้งแต่ข้อแรก
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                className="action-button liquid-control px-4 py-3 text-base font-black text-slate-700 hover:bg-white/70"
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
              >
                ยกเลิก
              </button>
              <button
                className="action-button liquid-button border border-rose-200/80 bg-rose-200/80 px-4 py-3 text-base font-black text-rose-950 hover:bg-rose-300/80"
                type="button"
                onClick={confirmResetGame}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
