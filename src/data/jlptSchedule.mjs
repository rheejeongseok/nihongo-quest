// Only published dates belong here; never infer registration from the month.
const schedules = {
  '2026-12-06': {
    regularStart: '2026-09-01', regularEnd: '2026-09-20',
    extraStart: '2026-09-28', extraEnd: '2026-10-04',
    label: '정규 9.1~9.20 · 추가 9.28~10.4',
    source: 'https://www.jpf.or.kr/index/content_print.php?bo_table=s6_1&wr_id=1374'
  }
};
const koreaDate = date => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(date).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
export function getJlptRegistration(examDate, now = new Date()) {
  const schedule = schedules[koreaDate(examDate)];
  if (!schedule) return { status: '접수 일정 확인 전', label: '공식 일정 발표 후 안내합니다.' };
  const today = koreaDate(now);
  const status = today < schedule.regularStart ? '접수 예정'
    : today <= schedule.regularEnd ? '정규 접수 기간'
    : today < schedule.extraStart ? '추가 접수 예정'
    : today <= schedule.extraEnd ? '추가 접수 기간' : '접수 마감';
  return { ...schedule, status };
}
