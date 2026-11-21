'use client';

import { useState } from 'react';
import styles from './Manual.module.css';

const steps = {
  opening: [
    '画面上部で「MarroN」または「Resort-style」を選び、管理中の店舗名を確認します。入力前に毎回確認してください。',
    '「顧客・予約・売上・稼働」→「売上状況」で営業日を選び、ルーム使用状況を確認します。予約と出勤予定は同じ時間軸に表示されます。',
    '「出勤・店舗管理」の出勤申請（営業日）を開き、女の子・店舗・日付・時間を確認してから「承認して出勤を確定」を押します。承認待ちは出勤情報に表示されません。',
    '登録済みの出勤に未指定のルームがあれば、必要に応じて「予定を編集」から割り当てます。'
  ],
  inquiry: [
    '「顧客・予約・売上・稼働」→「予約・会計」を開き、顧客検索で名前・電話番号・LINE名を調べます。顧客は両店舗で共通です。',
    '登録がなければ「＋ 新規顧客登録」を開き、名前・電話番号・利用店舗を入力して「顧客を登録して予約に選択」を押します。既存の顧客を重複登録しないよう電話番号を確認してください。',
    '問い合わせだけで予約にならなかった場合は「不成約（問い合わせのみ）」をチェックし、店舗・問い合わせ日・理由を入力して保存します。不成約は予約枠や売上には入りません。',
    '成約した場合はチェックせず、予約内容を入力します。'
  ],
  booking: [
    '「予約・会計」で顧客、店舗、ルーム、女の子、日付、開始時間を選びます。ルーム使用状況を見て重なりがないか確認してください。',
    '日付は実際のカレンダー日付を入力します。例：11月22日02:00の予約は「11月22日」と入力し、売上は11月21日の営業分になります。',
    'コース、延長、指名、割引・割増、オプション、キャストバック調整などを入力します。画面下の売上・女子給料（またはキャストバック）・店落ちを確認してください。',
    '受付時は状態を「予約」、支払方法を「未会計」にして保存します。予約が一覧に出ることを確認します。'
  ],
  payment: [
    '「予約・会計」の「未会計（全期間）」または予約一覧から該当予約の「編集」を押します。対象月が違っても未会計欄から探せます。',
    '実際のコース、延長、オプション、割引・割増、指名、キャストバック調整を確認し、必要なら修正します。',
    '支払方法を「現金」「カード」「PayPay」など実際の方法に変更し、状態を「会計済み」にして保存します。',
    '未会計欄から消えたことを確認します。売上状況の集計は、開始時刻が10:00〜翌05:00の会計済み予約を営業日単位で数えます。'
  ],
  shifts: [
    '「出勤・店舗管理」→「出勤予定を追加」で女の子、店舗、必要ならルーム、営業日、開始・終了を選んで保存します。',
    '営業日は10:00〜翌05:00です。例：11月21日営業分の00:00〜05:00は11月22日の深夜〜早朝として扱います。',
    '変更は「登録済みの出勤」→「予定を編集」から行い、変更を保存します。女の子からの申請は先に内容を確認して承認します。',
    '遅刻・早退・当日欠勤は、該当の出勤の「実績を入力」から記録します。予定通りなら同名の項目を選び、実際の開始・終了が違えば「出勤（実際の時刻を記録）」を選んで保存します。'
  ],
  profile: [
    '「プロフィール管理」で女の子を選んで「編集」、または新規登録フォームに入力します。',
    '在籍ブランドと在籍拠点を確認します。MarroNだけで登録したプロフィールはResort-styleのホームページに掲載しません。Resort-styleに掲載する場合は同ブランドの在籍設定を確認してください。',
    'プロフィール画像、店長からの紹介、本文などを確認して「プロフィールを保存」を押し、必要なら「サイトを確認」から表示を確認します。',
    '「女の子マイページ管理」では女の子用アカウントを管理します。ログイン情報は担当者本人に安全な方法で伝えてください。'
  ],
  media: [
    '先に店舗を選び、「媒体一覧」で媒体名・アドレス・ID・パスワードを登録または編集します。店舗ごとに一覧が分かれています。',
    'IDやパスワードは一覧のコピーアイコンでコピーできます。パスワードの「表示」は30秒後に自動で隠れます。',
    '他人が見られる画面にパスワードを貼り付けたり、共有端末にコピーしたままにしたりしないようにしてください。'
  ],
  customers: [
    '「顧客管理」は両店舗共通です。名前・電話番号・LINE名で検索し、両店舗利用、片方のみ、来店履歴なしで絞り込めます。',
    '顧客の「編集」で連絡先、利用店舗、接客メモ、注意事項を確認・更新して保存します。電話番号の重複に注意してください。',
    '利用回数・利用額は予約の会計内容から店舗別に確認できます。更新後に一覧の表示を確認してください。'
  ],
  expenses: [
    '「売上状況」で対象月と店舗を確認し、「経費」を開きます。',
    '必要なら店舗、日付、カテゴリを選び、内容と金額を入力して「経費を追加」を押します。明細と合計への反映を確認します。',
    '誤入力は明細の「編集」から直します。「集計から外す」はその経費を利益計算から除くときだけ使います。',
    '利益は対象月の店舗実質売上から対象月の経費を引いた額です。カード・PayPay売上も売上状況で確認できます。'
  ]
};

function Guide({ id, number, title, path, items, defaultOpen = false }) {
  return <details id={id} className={styles.guide} defaultOpen={defaultOpen}>
    <summary><span className={styles.number}>{number}</span><span><strong>{title}</strong><small>{path}</small></span><span className={styles.chevron} aria-hidden="true">⌄</span></summary>
    <ol>{items.map((item, index) => <li key={index}>{item}</li>)}</ol>
  </details>;
}

export default function Manual() {
  const [section, setSection] = useState('admin');
  return <section className={styles.manual} aria-label="スタッフ用マニュアル">
    <nav className={styles.sectionTabs} aria-label="マニュアルの分類">
      {[["admin", "管理画面"], ["reception", "受付"], ["media", "媒体"]].map(([key, label]) =>
        <button key={key} type="button" aria-pressed={section === key} className={section === key ? styles.selected : ''} onClick={() => setSection(key)}>{label}</button>
      )}
    </nav>
    {section === 'admin' && <div className={styles.content}>
    <div className="admin-panel">
      <p className={styles.eyebrow}>スタッフ用 操作ガイド</p>
      <h2 id="manual-title">管理画面マニュアル</h2>
      <p>MarroNとResort-style共通の操作ガイドです。受付から会計、出勤管理、サイト更新までを順番に確認できます。作業するときは画面上部で対象店舗を選び、管理中の店舗名を確認してください。</p>
      <div className={styles.note}><strong>営業日のルール</strong><span>毎日10:00〜翌05:00。出勤予定の「営業日」は翌朝05:00までを含みます。予約の「日付」は実際のカレンダー日付を入力します。</span></div>
      <nav className={styles.shortcuts} aria-label="マニュアルの項目">
        {[
          ['opening','開店前'],['inquiry','問い合わせ'],['booking','予約登録'],['payment','会計'],
          ['shifts','出勤管理'],['profile','プロフィール'],['media','媒体'],['customers','顧客'],['expenses','経費・売上']
        ].map(([id,label])=><a key={id} href={'#manual-'+id}>{label}</a>)}
      </nav>
    </div>
    <Guide id="manual-opening" number="01" title="開店前に確認する" path="店舗タブ → 売上状況・出勤申請" items={steps.opening} defaultOpen />
    <Guide id="manual-inquiry" number="02" title="問い合わせを受ける" path="顧客・予約・売上・稼働 → 予約・会計" items={steps.inquiry} defaultOpen />
    <Guide id="manual-booking" number="03" title="予約を登録する" path="顧客・予約・売上・稼働 → 予約・会計" items={steps.booking} />
    <Guide id="manual-payment" number="04" title="会計を済ませる" path="顧客・予約・売上・稼働 → 予約・会計" items={steps.payment} />
    <Guide id="manual-shifts" number="05" title="出勤を登録・変更する" path="出勤・店舗管理" items={steps.shifts} />
    <Guide id="manual-profile" number="06" title="プロフィールとマイページを更新する" path="プロフィール管理・女の子マイページ管理" items={steps.profile} />
    <Guide id="manual-media" number="07" title="媒体のログイン情報を管理する" path="媒体一覧" items={steps.media} />
    <Guide id="manual-customers" number="08" title="顧客情報を更新する" path="顧客・予約・売上・稼働 → 顧客管理" items={steps.customers} />
    <Guide id="manual-expenses" number="09" title="経費と売上を確認する" path="顧客・予約・売上・稼働 → 売上状況" items={steps.expenses} />
    <div className="admin-panel">
      <h3>退勤前の確認</h3>
      <ul className={styles.checks}>
        <li>未会計の予約に会計漏れがないか確認</li>
        <li>予約・不成約・出勤実績の入力漏れを確認</li>
        <li>翌営業日の出勤申請とルーム使用状況を確認</li>
      </ul>
      <p className={styles.small}>保存に失敗した場合は、再入力する前に一覧に登録されていないか確認してください。問題が続く場合は管理者へ連絡してください。</p>
    </div>
    </div>}
    {section !== 'admin' && <div className={styles.empty} aria-label={section === 'reception' ? '受付マニュアル' : '媒体マニュアル'} />}
  </section>;
}
