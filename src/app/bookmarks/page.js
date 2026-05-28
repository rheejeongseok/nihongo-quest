'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useJapaneseSpeech } from '@/hooks/useJapaneseSpeech';

export default function BookmarksPage() {
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState([]);
  const { speak } = useJapaneseSpeech();

  // 1. 단어장 단어 로드
  useEffect(() => {
    async function loadBookmarks() {
      try {
        const res = await fetch('/api/bookmarks');
        const data = await res.json();
        if (data.success) {
          setBookmarks(data.bookmarks);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadBookmarks();
  }, []);

  // 2. 단어 삭제 처리
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setBookmarks(prev => prev.filter(item => item.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 76px)' }}>
        <span style={{ fontSize: '3rem', animation: 'pulse 1.5s infinite' }}>⭐</span>
        <h3 style={{ marginTop: '16px', fontWeight: '800' }}>단어장을 열고 정렬하는 중...</h3>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '800px', padding: '40px 24px' }}>
      
      {/* 뒤로가기 및 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <Link href="/" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '700', fontSize: '0.9rem' }}>
          ← 로드맵 홈으로 이동
        </Link>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          ⭐ 나의 일본어 단어장 (Vocabulary)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
          퀴즈 도중 눈에 띈 어려운 단어들을 나만의 비밀 단어장에 모으고 소리내어 복습하는 공간
        </p>
      </div>

      {bookmarks.length === 0 ? (
        /* 단어장이 비어 있을 때의 웰컴 카드 */
        <div className="premium-card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <span style={{ fontSize: '4.5rem', display: 'block', marginBottom: '16px' }}>📖</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>단어장이 비어 있습니다!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            퀴즈 플레이 도중 마음에 드는 단어나 헷갈리는 문자를 보면 <strong>[나의 단어장 추가]</strong>를 꾹 눌러보세요.
          </p>
          <Link href="/" passHref legacyBehavior>
            <a className="glow-btn" style={{ padding: '12px 30px', textDecoration: 'none' }}>
              퀴즈 풀고 단어 수집하러 가기 ➔
            </a>
          </Link>
        </div>
      ) : (
        /* 단어장 리스트 */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ borderBottom: '1.5px solid var(--card-border)', paddingBottom: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-secondary)' }}>
              저장된 소중한 영단어/일어단어: 총 {bookmarks.length}개
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {bookmarks.map((item) => (
              <div 
                key={item.id} 
                className="premium-card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  minHeight: '110px'
                }}
              >
                <div>
                  {/* 단어의 요미가나 표기 */}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    {item.reading}
                  </span>
                  
                  {/* 단어 본문 */}
                  <h4 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                    {item.word}
                  </h4>
                  
                  {/* 단어 뜻 */}
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '700', marginTop: '6px' }}>
                    {item.meaning}
                  </p>
                </div>

                {/* 제어 버튼 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                  <button 
                    onClick={() => speak(item.word)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--card-border)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--custom-radius)',
                      cursor: 'pointer',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    🔊 재생
                  </button>

                  <button 
                    onClick={() => handleDelete(item.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.75rem',
                      background: 'rgba(255, 107, 107, 0.08)',
                      border: '1px solid rgba(255, 107, 107, 0.2)',
                      color: '#ff6b6b',
                      borderRadius: 'var(--custom-radius)',
                      cursor: 'pointer',
                      fontWeight: '700'
                    }}
                  >
                    🗑️ 제거
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

    </div>
  );
}
