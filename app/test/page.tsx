"use client";

import { useMemo, useState } from "react";

type Option = {
  id: string;
  label: string;
  description?: string;
  score: {
    exercise?: number;
    sleep?: number;
    study?: number;
    routine?: number;
    relationship?: number;
  };
};

type Question = {
  id: number;
  category: string;
  title: string;
  description: string;
  options: Option[];
};

const questions: Question[] = [
  {
    id: 1,
    category: "현재 상태",
    title: "요즘 하루를 보내고 나면\n어떤 느낌이 가장 많이 드나요?",
    description:
      "최근 2주 동안 가장 자주 느꼈던 상태를 기준으로 선택해 주세요.",
    options: [
      {
        id: "q1-1",
        label: "몸이 무겁고 쉽게 지친다",
        description: "충분히 쉬어도 에너지가 잘 회복되지 않아요.",
        score: { exercise: 4, sleep: 2 },
      },
      {
        id: "q1-2",
        label: "한 일 없이 시간이 지나간 것 같다",
        description: "생각은 많지만 실제 행동은 부족한 느낌이에요.",
        score: { routine: 4, study: 1 },
      },
      {
        id: "q1-3",
        label: "해야 할 일 때문에 계속 불안하다",
        description: "쉬는 동안에도 할 일이 머릿속에서 떠나지 않아요.",
        score: { sleep: 3, routine: 2 },
      },
      {
        id: "q1-4",
        label: "사람들에게 지나치게 신경 쓰게 된다",
        description: "내 상태보다 주변 반응을 먼저 살피게 돼요.",
        score: { relationship: 4 },
      },
    ],
  },
  {
    id: 2,
    category: "행동 패턴",
    title: "새로운 목표가 생겼을 때\n보통 어떻게 시작하나요?",
    description: "이상적인 모습보다 실제로 반복되는 행동을 선택해 주세요.",
    options: [
      {
        id: "q2-1",
        label: "계획과 자료를 충분히 준비한다",
        description: "준비는 많이 하지만 시작이 늦어지는 편이에요.",
        score: { exercise: 2, routine: 4 },
      },
      {
        id: "q2-2",
        label: "일단 바로 시작해 본다",
        description: "완벽하지 않아도 먼저 행동하는 편이에요.",
        score: { routine: 1 },
      },
      {
        id: "q2-3",
        label: "마음은 먹지만 계속 미룬다",
        description: "해야 한다고 생각하면서도 행동으로 옮기기 어려워요.",
        score: { exercise: 3, routine: 3 },
      },
      {
        id: "q2-4",
        label: "주변 사람이 하면 함께 시작한다",
        description: "혼자 하는 것보다 함께할 때 시작하기 쉬워요.",
        score: { relationship: 3, exercise: 1 },
      },
    ],
  },
  {
    id: 3,
    category: "생활 리듬",
    title: "현재 가장 불규칙하다고\n느끼는 부분은 무엇인가요?",
    description: "가장 먼저 개선하고 싶은 생활 영역을 골라 주세요.",
    options: [
      {
        id: "q3-1",
        label: "수면 시간",
        description: "자는 시간과 일어나는 시간이 매일 달라요.",
        score: { sleep: 5 },
      },
      {
        id: "q3-2",
        label: "식사와 운동",
        description: "끼니와 신체 활동을 일정하게 유지하기 어려워요.",
        score: { exercise: 5 },
      },
      {
        id: "q3-3",
        label: "공부와 업무",
        description: "집중을 시작하고 유지하는 시간이 일정하지 않아요.",
        score: { study: 5, routine: 1 },
      },
      {
        id: "q3-4",
        label: "약속과 인간관계",
        description: "사람을 만난 뒤 생활 리듬이 자주 무너져요.",
        score: { relationship: 4, sleep: 1 },
      },
    ],
  },
  {
    id: 4,
    category: "실행력",
    title: "계획을 지키지 못했을 때\n가장 가까운 반응은 무엇인가요?",
    description: "실패한 직후 실제로 보이는 반응을 선택해 주세요.",
    options: [
      {
        id: "q4-1",
        label: "다음 날 더 완벽하게 다시 시작한다",
        description: "계획을 새로 짜지만 부담이 더 커지기도 해요.",
        score: { routine: 4, exercise: 1 },
      },
      {
        id: "q4-2",
        label: "이번 주는 이미 망했다고 생각한다",
        description: "한 번 놓치면 다시 시작하기 어려워져요.",
        score: { exercise: 3, routine: 3 },
      },
      {
        id: "q4-3",
        label: "계획을 줄이고 작은 것부터 한다",
        description: "상황에 맞춰 기준을 조정하는 편이에요.",
        score: { routine: 1 },
      },
      {
        id: "q4-4",
        label: "다른 일로 관심을 돌린다",
        description: "실패한 계획을 자연스럽게 잊어버리는 편이에요.",
        score: { study: 2, routine: 2 },
      },
    ],
  },
  {
    id: 5,
    category: "우선순위",
    title: "지금 하나만 개선할 수 있다면\n무엇을 선택하고 싶나요?",
    description: "가장 현실적으로 달라졌으면 하는 영역을 선택해 주세요.",
    options: [
      {
        id: "q5-1",
        label: "체력과 몸 상태",
        description: "덜 피곤하고 조금 더 가볍게 움직이고 싶어요.",
        score: { exercise: 6 },
      },
      {
        id: "q5-2",
        label: "수면과 생활 리듬",
        description: "일정한 시간에 자고 일어나고 싶어요.",
        score: { sleep: 6 },
      },
      {
        id: "q5-3",
        label: "집중력과 생산성",
        description: "해야 할 일을 미루지 않고 끝내고 싶어요.",
        score: { study: 6 },
      },
      {
        id: "q5-4",
        label: "감정과 인간관계",
        description: "사람 때문에 소모되는 에너지를 줄이고 싶어요.",
        score: { relationship: 6 },
      },
    ],
  },
];

const resultLabels = {
  exercise: {
    name: "운동",
    title: "신체 에너지 회복형",
    description:
      "현재는 더 많은 계획을 세우기보다 몸을 움직이며 생활 에너지를 회복하는 것이 우선입니다.",
  },
  sleep: {
    name: "수면",
    title: "생활 리듬 회복형",
    description:
      "수면 시간을 일정하게 유지하는 것만으로도 집중력과 감정 상태가 개선될 가능성이 높습니다.",
  },
  study: {
    name: "집중",
    title: "집중 환경 설계형",
    description:
      "의지보다 시작 조건을 단순하게 만들고 짧은 집중 시간을 반복하는 방식이 필요합니다.",
  },
  routine: {
    name: "작은 실행",
    title: "시작 장벽 완화형",
    description:
      "완벽하게 준비하는 것보다 부담이 없는 작은 행동을 먼저 시작하는 것이 중요합니다.",
  },
  relationship: {
    name: "관계 정리",
    title: "에너지 경계 회복형",
    description:
      "주변의 반응보다 본인의 상태를 먼저 확인하고 관계에 사용할 에너지를 조절해야 합니다.",
  },
};

export default function HabitTestPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQuestion = questions[currentIndex];
  const selectedOptionId = answers[currentQuestion.id];

  const progress = ((currentIndex + 1) / questions.length) * 100;

  const result = useMemo(() => {
    const scores = {
      exercise: 0,
      sleep: 0,
      study: 0,
      routine: 0,
      relationship: 0,
    };

    questions.forEach((question) => {
      const selectedId = answers[question.id];
      const selectedOption = question.options.find(
        (option) => option.id === selectedId,
      );

      if (!selectedOption) return;

      Object.entries(selectedOption.score).forEach(([key, value]) => {
        scores[key as keyof typeof scores] += value ?? 0;
      });
    });

    const resultKey = (
      Object.entries(scores) as Array<
        [keyof typeof scores, number]
      >
    ).sort((a, b) => b[1] - a[1])[0][0];

    return {
      key: resultKey,
      score: scores[resultKey],
      ...resultLabels[resultKey],
    };
  }, [answers]);

  const handleSelect = (optionId: string) => {
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNext = () => {
    if (!selectedOptionId) return;

    if (currentIndex === questions.length - 1) {
      setIsCompleted(true);
      return;
    }

    setCurrentIndex((previous) => previous + 1);
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((previous) => previous - 1);
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentIndex(0);
    setIsCompleted(false);
  };

  if (isCompleted) {
    return (
      <TestResult
        result={result}
        onRestart={handleRestart}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#e9e9e5] px-5 py-10 text-[#171715]">
      <section className="mx-auto w-full max-w-[1180px] overflow-hidden bg-[#fdfdfb] shadow-[0_28px_90px_rgba(0,0,0,0.14)]">
        <div className="grid min-h-[760px] lg:grid-cols-[340px_1fr]">
          {/* Left information panel */}
          <aside className="relative overflow-hidden bg-[#171715] px-9 py-10 text-white">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full border-[55px] border-white/[0.04]" />

            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center bg-[#2864e8] text-sm font-black">
                  HI
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#8fb0ff]">
                    Habit Insight
                  </p>

                  <p className="mt-1 text-xs text-white/50">
                    Lifestyle Assessment
                  </p>
                </div>
              </div>

              <div className="mt-20">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8fb0ff]">
                  Personal Diagnostic
                </p>

                <h1 className="mt-5 text-[40px] font-black leading-[1.12] tracking-[-0.045em]">
                  지금 나에게
                  <br />
                  필요한 습관은
                  <br />
                  무엇일까요?
                </h1>

                <p className="mt-6 text-[14px] leading-7 text-white/55">
                  생활 패턴과 행동 방식을 분석해 지금 가장 먼저 개선하면
                  좋은 습관을 찾아드립니다.
                </p>
              </div>

              <div className="mt-auto">
                <div className="border-t border-white/15 pt-7">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/50">
                      예상 소요 시간
                    </span>

                    <strong>약 2분</strong>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/50">
                      전체 문항
                    </span>

                    <strong>{questions.length}문항</strong>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/50">
                      분석 방식
                    </span>

                    <strong>생활 패턴 분석</strong>
                  </div>
                </div>

                <p className="mt-8 text-[9px] uppercase tracking-[0.22em] text-white/25">
                  Habit Insight Analysis Model 2.1
                </p>
              </div>
            </div>
          </aside>

          {/* Question area */}
          <div className="flex min-h-[760px] flex-col px-7 py-8 sm:px-12 sm:py-10 lg:px-16">
            <header>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#2864e8]">
                    {currentQuestion.category}
                  </p>

                  <p className="mt-2 text-xs font-semibold text-[#999994]">
                    Question {String(currentIndex + 1).padStart(2, "0")}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[23px] font-black">
                    {String(currentIndex + 1).padStart(2, "0")}
                  </span>

                  <span className="mx-2 text-[#c5c5bf]">/</span>

                  <span className="text-sm font-bold text-[#999994]">
                    {String(questions.length).padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div className="mt-7 h-[4px] overflow-hidden bg-[#e5e5e0]">
                <div
                  className="h-full bg-[#2864e8] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </header>

            <section className="mt-12">
              <h2 className="whitespace-pre-line text-[32px] font-black leading-[1.3] tracking-[-0.04em] sm:text-[38px]">
                {currentQuestion.title}
              </h2>

              <p className="mt-4 text-[14px] leading-7 text-[#777773]">
                {currentQuestion.description}
              </p>

              <div className="mt-9 grid gap-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = selectedOptionId === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      className={`group grid w-full grid-cols-[42px_1fr_28px] items-center gap-4 border p-5 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-[#2864e8] bg-[#f2f6ff] shadow-[5px_5px_0_#dbe5ff]"
                          : "border-[#dfdfda] bg-white hover:border-[#aebde5] hover:bg-[#fafbff]"
                      }`}
                    >
                      <span
                        className={`grid h-9 w-9 place-items-center text-xs font-black transition ${
                          isSelected
                            ? "bg-[#2864e8] text-white"
                            : "bg-[#f1f1ed] text-[#777773] group-hover:bg-[#e9edfa]"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span>
                        <span className="block text-[15px] font-black text-[#242421]">
                          {option.label}
                        </span>

                        {option.description && (
                          <span className="mt-1.5 block text-[12px] leading-5 text-[#858580]">
                            {option.description}
                          </span>
                        )}
                      </span>

                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full border transition ${
                          isSelected
                            ? "border-[#2864e8] bg-[#2864e8]"
                            : "border-[#ccccC7]"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            viewBox="0 0 20 20"
                            className="h-3.5 w-3.5 fill-none stroke-white stroke-[2.5]"
                          >
                            <path d="M4 10.5 8 14l8-9" />
                          </svg>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <footer className="mt-auto flex items-center justify-between border-t border-[#e1e1dc] pt-7">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-2 py-3 text-sm font-bold text-[#777773] transition hover:text-[#171715] disabled:cursor-not-allowed disabled:opacity-25"
              >
                <span>←</span>
                이전
              </button>

              <div className="hidden text-[10px] uppercase tracking-[0.2em] text-[#aaa9a3] sm:block">
                Select one answer
              </div>

              <button
                type="button"
                onClick={handleNext}
                disabled={!selectedOptionId}
                className="flex min-w-[136px] items-center justify-center gap-3 bg-[#171715] px-7 py-4 text-sm font-black text-white transition hover:bg-[#2864e8] disabled:cursor-not-allowed disabled:bg-[#d3d3ce] disabled:text-[#999994]"
              >
                {currentIndex === questions.length - 1
                  ? "분석 결과 보기"
                  : "다음 질문"}

                <span>→</span>
              </button>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}

function TestResult({
  result,
  onRestart,
}: {
  result: {
    name: string;
    title: string;
    description: string;
    score: number;
  };
  onRestart: () => void;
}) {
  return (
    <main className="min-h-screen bg-[#e9e9e5] px-5 py-10 text-[#171715]">
      <section className="mx-auto grid min-h-[760px] w-full max-w-[1100px] overflow-hidden bg-[#fdfdfb] shadow-[0_28px_90px_rgba(0,0,0,0.14)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col px-8 py-10 sm:px-14 sm:py-14">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#2864e8]">
              Analysis Complete
            </p>

            <h1 className="mt-6 text-[44px] font-black leading-[1.12] tracking-[-0.055em] sm:text-[58px]">
              분석이
              <br />
              완료되었습니다.
            </h1>

            <p className="mt-6 max-w-[500px] text-[15px] leading-7 text-[#6c6c68]">
              선택한 응답을 기반으로 현재 생활에 가장 큰 영향을 줄 수 있는
              우선 습관을 분석했습니다.
            </p>
          </div>

          <div className="mt-14 border-l-[5px] border-[#2864e8] pl-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#999994]">
              Recommended Habit
            </p>

            <p className="mt-4 text-[52px] font-black tracking-[-0.06em] text-[#2864e8]">
              {result.name}
            </p>

            <h2 className="mt-5 text-[25px] font-black">
              {result.title}
            </h2>

            <p className="mt-4 max-w-[520px] text-[14px] leading-7 text-[#666662]">
              {result.description}
            </p>
          </div>

          <div className="mt-auto flex flex-wrap gap-3 pt-12">
            <button
              type="button"
              className="bg-[#171715] px-7 py-4 text-sm font-black text-white transition hover:bg-[#2864e8]"
            >
              상세 보고서 확인
            </button>

            <button
              type="button"
              onClick={onRestart}
              className="border border-[#d5d5d0] bg-white px-7 py-4 text-sm font-black transition hover:border-[#171715]"
            >
              다시 테스트하기
            </button>
          </div>
        </div>

        <aside className="relative overflow-hidden bg-[#171715] px-9 py-12 text-white">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />

          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#8fb0ff]">
                Habit Insight
              </p>

              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                Result 01
              </span>
            </div>

            <div className="mt-20">
              <p className="text-sm font-semibold text-white/45">
                Recommendation confidence
              </p>

              <p className="mt-3 text-[72px] font-black tracking-[-0.07em]">
                94.7
                <span className="ml-2 text-xl text-white/30">%</span>
              </p>

              <div className="mt-7 h-[6px] bg-white/10">
                <div className="h-full w-[94.7%] bg-[#4d7ff1]" />
              </div>
            </div>

            <div className="mt-16 space-y-7">
              <ResultMetric
                number="01"
                title="행동 시작 속도"
                value="68%"
              />

              <ResultMetric
                number="02"
                title="생활 균형 필요도"
                value="91%"
              />

              <ResultMetric
                number="03"
                title="변화 의지"
                value="87%"
              />
            </div>

            <p className="mt-auto text-[10px] leading-5 text-white/30">
              본 분석은 사용자의 자기 보고 응답을 기반으로 제공되는 생활 습관
              참고 자료입니다.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function ResultMetric({
  number,
  title,
  value,
}: {
  number: string;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 pb-5">
      <div className="flex items-center gap-4">
        <span className="font-mono text-[10px] text-[#8fb0ff]">
          {number}
        </span>

        <span className="text-sm font-bold text-white/65">
          {title}
        </span>
      </div>

      <strong className="text-xl font-black">
        {value}
      </strong>
    </div>
  );
}