"use client";

type InfoProps = {
  title: string;
  value: string;
  description?: string;
};

export default function ReportCoverPage() {
  return (
    <main className="min-h-screen overflow-x-auto bg-[#d9d9d6] px-6 py-12 text-[#161616] print:bg-white print:p-0">
      {/* A4 Document */}
      <article
        className="relative mx-auto overflow-hidden bg-[#fdfdfb] shadow-[0_30px_100px_rgba(0,0,0,0.22)] print:shadow-none"
        style={{
          width: "794px",
          minHeight: "1123px",
        }}
      >
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-48 -top-44 h-[560px] w-[560px] rounded-full border-[90px] border-[#e8eefc]" />

          <div className="absolute right-[-110px] top-[82px] h-[360px] w-[360px] rounded-full border border-[#b9c8ef]" />

          <div className="absolute bottom-[-190px] left-[-170px] h-[460px] w-[460px] rounded-full bg-[#f0f3fa]" />

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(#111 1px, transparent 1px), linear-gradient(90deg, #111 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />
        </div>

        {/* Left document rail */}
        <aside className="absolute bottom-0 left-0 top-0 w-[14px] bg-[#1856d8]" />

        <div className="relative z-10 flex min-h-[1123px] flex-col px-[74px] py-[62px]">
          {/* Header */}
          <header className="flex items-start justify-between border-b border-[#d9d9d4] pb-7">
            <div className="flex items-start gap-4">
              <div className="mt-1 grid h-11 w-11 place-items-center bg-[#1856d8]">
                <span className="text-[15px] font-black tracking-[-0.08em] text-white">
                  HI
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-[#1856d8]">
                  Habit Insight Report
                </p>

                <p className="mt-2 text-[13px] font-medium text-[#777773]">
                  AI Lifestyle Pattern Analysis
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#999994]">
                Confidential
              </p>

              <p className="mt-2 text-[12px] font-bold text-[#333330]">
                HR-260718-01842
              </p>
            </div>
          </header>

          {/* Document category */}
          <div className="mt-14 flex items-center gap-4">
            <span className="h-[2px] w-12 bg-[#1856d8]" />

            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-[#1856d8]">
              Personal Analysis · Executive Edition
            </p>
          </div>

          {/* Hero */}
          <section className="mt-12 max-w-[650px]">
            <p className="text-[15px] font-semibold text-[#6c6c68]">
              응답 데이터를 기반으로 분석한
            </p>

            <h1 className="mt-3 text-[68px] font-black leading-[1.03] tracking-[-0.065em] text-[#11110f]">
              당신에게 가장
              <br />
              필요한 습관
            </h1>

            <div className="mt-9 flex items-center gap-5">
              <div className="inline-flex items-center gap-4 bg-[#1856d8] px-7 py-4 shadow-[8px_8px_0_#dbe4fa]">
                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-blue-100">
                  Priority
                </span>

                <span className="h-6 w-px bg-white/40" />

                <strong className="text-[31px] font-black tracking-[-0.04em] text-white">
                  운동
                </strong>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#999994]">
                  Recommendation Score
                </p>

                <p className="mt-1 text-[20px] font-black text-[#191917]">
                  94.7
                  <span className="ml-1 text-[11px] font-semibold text-[#999994]">
                    / 100
                  </span>
                </p>
              </div>
            </div>

            <p className="mt-10 max-w-[610px] text-[17px] font-medium leading-[1.85] text-[#555551]">
              현재의 생활 패턴과 목표, 행동 성향을 종합적으로 분석한 결과
              신체 활동을 회복하는 것이 생활 전반의 균형과 실행력을 가장
              효과적으로 높일 수 있는 핵심 전략으로 나타났습니다.
            </p>
          </section>

          {/* Main conclusion */}
          <section className="mt-16 grid grid-cols-[0.9fr_1.35fr] gap-5">
            <div className="relative overflow-hidden bg-[#171715] p-8 text-white">
              <div className="absolute right-[-45px] top-[-45px] h-32 w-32 rounded-full border-[28px] border-white/5" />

              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#95b4ff]">
                Primary Pattern
              </p>

              <h2 className="mt-6 text-[31px] font-black leading-[1.2] tracking-[-0.045em]">
                행동보다
                <br />
                준비가 앞서는
                <br />
                신중형
              </h2>

              <div className="mt-8 h-px bg-white/15" />

              <p className="mt-6 text-[13px] leading-7 text-white/65">
                시작 전 충분히 고민하고 준비하려는 경향이 강합니다. 목표는
                분명하지만 첫 행동을 시작하는 데 상대적으로 많은 에너지를
                사용합니다.
              </p>

              <div className="mt-8 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
                  Pattern Index
                </span>

                <span className="font-mono text-[14px] font-bold">
                  P-04
                </span>
              </div>
            </div>

            <div className="border border-[#ddddda] bg-white/85 p-8 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#999994]">
                    Executive Summary
                  </p>

                  <h3 className="mt-3 text-[21px] font-black tracking-[-0.025em]">
                    분석 결과 요약
                  </h3>
                </div>

                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#edf2ff] text-[13px] font-black text-[#1856d8]">
                  01
                </span>
              </div>

              <div className="mt-7 space-y-5">
                <SummaryItem
                  number="01"
                  title="높은 목표 인식"
                  text="변화의 필요성과 본인이 원하는 방향을 비교적 명확하게 인식하고 있습니다."
                />

                <SummaryItem
                  number="02"
                  title="시작 단계의 저항"
                  text="행동을 시작하기 전에 조건과 준비 상태를 충분히 갖추려는 경향이 반복됩니다."
                />

                <SummaryItem
                  number="03"
                  title="신체 에너지 회복 필요"
                  text="현재는 생산성 관리보다 활동량과 생활 리듬 회복이 우선되어야 합니다."
                />
              </div>
            </div>
          </section>

          {/* Data strip */}
          <section className="mt-8 border-y border-[#d9d9d4] py-7">
            <div className="grid grid-cols-4 divide-x divide-[#ddddda]">
              <Info
                title="Analysis Date"
                value="2026.07.18"
                description="KST 기준"
              />

              <Info
                title="Responses"
                value="96"
                description="유효 응답 수"
              />

              <Info
                title="Confidence"
                value="94.7%"
                description="분석 신뢰도"
              />

              <Info
                title="Report Version"
                value="2.1"
                description="Analysis Model"
              />
            </div>
          </section>

          {/* Key indicator */}
          <section className="mt-8 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#999994]">
                Key Behavioral Indicator
              </p>

              <p className="mt-3 max-w-[430px] text-[14px] leading-7 text-[#555551]">
                완벽하게 준비한 뒤 시작하는 것보다, 작은 행동을 먼저 시작했을
                때 습관 형성 가능성이 크게 높아지는 유형입니다.
              </p>
            </div>

            <div className="w-[165px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777773]">
                  Action Readiness
                </span>

                <span className="text-[12px] font-black text-[#1856d8]">
                  68%
                </span>
              </div>

              <div className="mt-3 h-[6px] overflow-hidden bg-[#e7e7e3]">
                <div className="h-full w-[68%] bg-[#1856d8]" />
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-auto flex items-end justify-between border-t border-[#d9d9d4] pt-6">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.26em] text-[#aaa9a3]">
                Generated by
              </p>

              <p className="mt-2 text-[12px] font-bold text-[#555551]">
                Habit Insight AI Analytics System
              </p>
            </div>

            <div className="flex items-center gap-5">
              <p className="text-[9px] uppercase tracking-[0.22em] text-[#aaa9a3]">
                Private & Confidential
              </p>

              <span className="h-4 w-px bg-[#d0d0cc]" />

              <p className="font-mono text-[12px] font-bold text-[#333330]">
                01 / 12
              </p>
            </div>
          </footer>
        </div>
      </article>
    </main>
  );
}

function SummaryItem({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="grid grid-cols-[30px_1fr] gap-4">
      <span className="pt-[2px] font-mono text-[10px] font-bold text-[#1856d8]">
        {number}
      </span>

      <div className="border-b border-[#ededeb] pb-5 last:border-b-0 last:pb-0">
        <p className="text-[14px] font-black text-[#252522]">
          {title}
        </p>

        <p className="mt-2 text-[12px] leading-6 text-[#6b6b67]">
          {text}
        </p>
      </div>
    </div>
  );
}

function Info({
  title,
  value,
  description,
}: InfoProps) {
  return (
    <div className="px-5 first:pl-0 last:pr-0">
      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#999994]">
        {title}
      </p>

      <p className="mt-3 whitespace-nowrap text-[20px] font-black tracking-[-0.025em] text-[#171715]">
        {value}
      </p>

      {description && (
        <p className="mt-1 text-[10px] text-[#aaa9a3]">
          {description}
        </p>
      )}
    </div>
  );
}