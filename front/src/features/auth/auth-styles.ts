export const authStyles = {
  auth_shell: "rf-auth-shell min-h-svh bg-[#f5f7f5] text-slate-900",
  auth_topbar:
    "rf-auth-topbar h-14 border-b border-slate-200/80 bg-white [&_.rf-logo]:w-30 [&_.rf-logo>small]:hidden lg:h-16 lg:[&_.rf-logo]:w-37",
  auth_main:
    "flex min-h-[calc(100svh-56px)] items-center justify-center px-6 py-5 lg:min-h-[calc(100svh-64px)] lg:px-10 lg:py-6",
  auth_layout:
    "rf-auth-layout grid w-full max-w-100 lg:min-h-140 lg:max-w-270 lg:grid-cols-[0.96fr_1fr] lg:overflow-hidden lg:rounded-3xl lg:border lg:border-slate-200/80 lg:bg-white lg:shadow-[0_24px_80px_-40px_#13362b40]",
  auth_story:
    "rf-auth-story relative isolate hidden flex-col justify-between overflow-hidden bg-[radial-gradient(ellipse_at_70%_50%,#173d33_0%,#10251f_55%,#0b1916_100%)] p-8 text-white lg:flex xl:px-10 xl:py-9",
  auth_form_panel:
    "rf-auth-form min-w-0 self-center text-slate-900 lg:px-10 lg:py-7 xl:px-12",
  heading:
    "text-[19px] leading-[1.3] font-bold tracking-[-0.5px] min-[390px]:text-[21px] sm:text-[23px]",
  form: "rf-form mt-5 grid gap-4",
  field: "grid min-w-0 gap-1.5",
  label: "text-rf-caption font-semibold leading-5 text-slate-700",
  input:
    "h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3.5 text-rf-control text-slate-900 outline-none transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-700 focus:ring-3 focus:ring-emerald-600/10 aria-invalid:border-red-500 aria-invalid:bg-red-50/40 aria-invalid:focus:ring-red-500/10 disabled:cursor-wait disabled:opacity-65 motion-reduce:transition-none lg:bg-slate-50/50",
  hint: "text-rf-caption leading-5 text-slate-500",
  field_error: "text-rf-caption leading-relaxed text-red-700",
  server_error:
    "flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-rf-body leading-relaxed text-red-800",
  notice:
    "rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-rf-body leading-relaxed text-emerald-900",
  text_link:
    "rf-text-link inline-flex min-h-8 items-center gap-1 text-rf-small font-semibold text-emerald-800 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600",
  btn_full:
    "rf-btn rf-full inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-transparent bg-[#145340] px-5 py-2.5 text-rf-control font-semibold text-white shadow-[0_4px_12px_-7px_#065f46] transition-colors hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-65 motion-reduce:transition-none",
  switcher:
    "mt-4 border-t border-slate-200/80 pt-3 text-center text-rf-small leading-5 text-slate-500",
};
