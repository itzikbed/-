# איך מריצים את הפרומפטים באנטי-גרביטי

## הכנה חד-פעמית (2 דקות)

1. צור תיקיית פרויקט **ריקה**, למשל: `C:\Users\itzik\projects\cat-adoption`
2. פתח אותה כ-Workspace באנטי-גרביטי (Agent Manager → New Workspace).
3. זהו. את העתקת המסמכים והסקילים לתוך הפרויקט עושה הסוכן של הודעה 1 בעצמו
   (STEP 0 בהודעה — ראה `הודעות-לסוכנים.md`).
4. מומלץ: מצב **Planning** (לא Fast) לכל שלב — הפרויקט מרובה-קבצים ודורש תכנון.

## הרצה — שלב אחרי שלב

**כלל זהב: שיחת סוכן חדשה לכל שלב.** לא ממשיכים שלב 2 באותה שיחה של שלב 1
(קונטקסט ארוך = סוכן שמתחיל לשכוח חוקים).

### הודעת פתיחה לשלב 1 (העתק-הדבק):

```
You are the lead agent for this project.
1. Read prompts/00-orchestrator.md in full — these are your standing rules for the entire build.
2. Read ARCHITECTURE.md and DESIGN.md in full.
3. The skill files referenced by the orchestrator live in the skills/ folder — read each skill when the orchestrator's skill map says it applies to your current task.
4. Now execute prompts/01-foundation.md, including its parallel tracks (use sub-agents for tracks marked ∥, respecting the file-ownership boundaries).
Do not skip the exit criteria. When done, list what you built and show the DoD gate results.
```

### לשלבים הבאים — אותה הודעה, מחליפים רק את מספר הקובץ:

```
You are the lead agent continuing an existing build.
1. Read prompts/00-orchestrator.md in full — standing rules.
2. Read ARCHITECTURE.md end-to-end (it reflects what was already built) and DESIGN.md.
3. Read the skills listed at the top of the phase prompt from the skills/ folder.
4. Execute prompts/02-catalog-landing.md, including its parallel tracks via sub-agents.
Do not skip the exit criteria. When done, list what you built and show the DoD gate results.
```

(וכך הלאה: `03-forms-flows.md`, `04-admin-emails.md`, `05-polish-qa.md`.)

### מקביליות — שתי דרכים, בחר אחת:

- **פשוטה (מומלץ להתחלה):** סוכן אחד מוביל שמפעיל תתי-סוכנים בעצמו — זה מה
  שההודעות למעלה עושות. הוא מנהל את החלוקה לבד.
- **מתקדמת:** באמצע שלב אפשר לפתוח 2–3 סוכנים במקביל ב-Agent Manager על אותו
  Workspace, ולתת לכל אחד Track אחד מהפרומפט (למשל "Execute ONLY Track B of
  prompts/02-catalog-landing.md; do not touch files owned by other tracks").
  ⚠ רק אם ה-Tracks מסומנים ∥ באותו שלב, ולעולם לא שני סוכנים על אותו קובץ.

## דברים שרק אתה יכול לעשות (הסוכן יעצור ויבקש)

| שלב | מה תצטרך |
|---|---|
| 1 | חשבון Supabase (חינם) → צור פרויקט, תן לסוכן את ה-URL ושני המפתחות |
| 4 | חשבון Resend (חינם) → API key; אימות דומיין אפשר לדחות לשלב 5 |
| 5 | חשבון Vercel (חינם) + דומיין |

## אחרי כל שלב

1. בדוק שהסוכן באמת הריץ את ה-exit criteria (אם לא — "Run the exit criteria now").
2. בקש ממנו סקרינשוטים אם לא סיפק.
3. חזור לקלוד (הארכיטקט) ואמור "סיימו שלב X" — אני אעבור על הקוד ואחזיר תיקונים.
   רצוי לתקן ממצאים לפני שממשיכים לשלב הבא.
