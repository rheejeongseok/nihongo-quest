'use client';

import { useEffect, useState } from 'react';

function getFirstSundayOfMonth(year, monthIndex) {
  const date = new Date(year, monthIndex, 1);
  while (date.getDay() !== 0) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function getNextJlptExamDate() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const julyExam = getFirstSundayOfMonth(currentYear, 6);
  const decemberExam = getFirstSundayOfMonth(currentYear, 11);

  julyExam.setHours(13, 10, 0, 0);
  decemberExam.setHours(13, 10, 0, 0);

  if (now < julyExam) return julyExam;
  if (now < decemberExam) return decemberExam;

  const nextJulyExam = getFirstSundayOfMonth(currentYear + 1, 6);
  nextJulyExam.setHours(13, 10, 0, 0);
  return nextJulyExam;
}

function calculateTimeLeft(examDate) {
  const difference = Math.max(0, examDate.getTime() - Date.now());
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60)
  };
}

export default function JlptTimer() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const examDate = getNextJlptExamDate();
    const updateTimer = () => setTimeLeft(calculateTimeLeft(examDate));

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  const units = [
    { label: '일', value: timeLeft.days, color: 'var(--accent-color)' },
    { label: '시', value: timeLeft.hours, color: '#ff9f43' },
    { label: '분', value: timeLeft.minutes, color: '#1dd1a1' },
    { label: '초', value: timeLeft.seconds, color: '#ff5e7e' }
  ];

  return (
    <div className='count-timer' style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      {units.map((unit) => (
        <div key={unit.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            minWidth: '54px',
            height: '54px',
            background: 'var(--bg-secondary)',
            border: `2px solid ${unit.color}`,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            fontWeight: '950',
            color: unit.color,
            boxShadow: `0 0 10px ${unit.color}22`
          }}>
            {String(unit.value).padStart(2, '0')}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '800', marginTop: '4px' }}>
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}
