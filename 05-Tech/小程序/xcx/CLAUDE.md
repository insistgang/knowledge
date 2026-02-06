# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered Chinese language learning WeChat Mini Program built with Taro 3.x + React and WeChat Cloud Development. Provides vocabulary learning, poetry study, idiom learning, pinyin practice, and AI tutoring via DeepSeek API.

## Commands

```bash
npm run dev:weapp    # Start development with watch mode
npm run build:weapp  # Build for production (output to dist/)
npm install          # Install dependencies
```

### Cloud Function Deployment

Cloud functions MUST be deployed via WeChat Developer Tools:
1. Right-click cloud function folder → "上传并部署：云端安装依赖"
2. Wait for deployment confirmation
3. Configure environment variables if needed (e.g., `DEEPSEEK_API_KEY` for `chat` function)

### Data Import

See `DEPLOY_GUIDE.md` for detailed instructions. Use `import-data` cloud function with actions like `importAll`, `importVocabulary`, `importIdioms`, `checkStatus`.

## Architecture

### Tech Stack
- **Frontend**: Taro 3.6.x + React 18 → WeChat Mini Program
- **Backend**: WeChat Cloud Development (云函数 + 云数据库)
- **AI**: DeepSeek API for chat functionality
- **Build**: Webpack 5 with Taro CLI

### Cloud Function Pattern

All cloud functions follow this pattern:
```javascript
exports.main = async (event, context) => {
  const { action, _openid, ...params } = event

  // Security: get real openid from server context
  const wxContext = cloud.getWXContext()
  const realOpenid = wxContext.OPENID

  // Validate openid to prevent forgery
  if (typeof _openid !== 'undefined' && _openid !== realOpenid) {
    return { success: false, message: '身份验证失败' }
  }

  switch (action) {
    case 'someAction':
      return await handleAction(realOpenid, params)
    // ...
  }
}
```

**Key Points:**
- `action` parameter determines which function to execute
- `_openid` from request is validated against server-side `realOpenid`
- Return format: `{ success: boolean, data?: any, message?: string }`

### Frontend Service Layer

Services in `src/services/` wrap cloud function calls:

```javascript
// src/services/request.js
export const callCloudFunction = async (name, data = {}) => {
  const openid = await storage.getOpenid()
  const requestData = { ...data, _openid: openid }
  const res = await Taro.cloud.callFunction({ name, data: requestData })
  return res.result
}
```

**DB Helper Class** (in `request.js`):
```javascript
import db from '../services/request'
const records = await db.getList('collection_name', { status: 'active' }, { limit: 20 })
```

### Authentication Flow

`AuthContext.jsx` provides global auth state:
- `useAuth()` hook gives access to: `userInfo`, `openid`, `isLogin`, `loading`, `login()`, `logout()`, `register()`, `updateUserInfo()`
- OpenID stored in local storage, auto-injected into all cloud function calls
- Wrap app with `<AuthProvider>` in `app.jsx`

### Event Bus Pattern (Cross-Page Communication)

`src/utils/eventBus.js` enables cross-page communication:

```javascript
import eventBus, { EVENTS } from '../utils/eventBus'

// Emit event (e.g., after completing practice)
eventBus.emit(EVENTS.STUDY_RECORD_UPDATED, { type: 'vocabulary', score: 90 })

// Listen for event (e.g., in home/profile pages)
useEffect(() => {
  const unsubscribe = eventBus.on(EVENTS.STUDY_RECORD_UPDATED, (data) => {
    // Refresh statistics
    loadStats()
  })
  return unsubscribe // Cleanup
}, [])
```

**Predefined Events:**
- `ANSWER_SUBMITTED` - After answering a question
- `PRACTICE_COMPLETED` - After completing practice session
- `STUDY_RECORD_UPDATED` - After saving study record
- `USER_INFO_UPDATED` - After user info changes

### Practice Page Answer Saving Pattern

Practice pages (vocabulary, idiom, pinyin, correction) MUST save answers to `answer_history`:

```javascript
const finishPractice = async () => {
  // Prepare answer data
  const answerData = questions.map(q => ({
    questionId: q.id,
    answer: userAnswers.current[q.id] ?? -1,
    isCorrect: userAnswers.current[q.id] === q.correctAnswer,
    questionType: 'vocabulary' // or 'idiom', 'pinyin', 'correction'
  }))

  // Save to answer_history via cloud function
  await Taro.cloud.callFunction({
    name: 'question',
    data: {
      action: 'submitBatch',
      answers: answerData
    }
  })

  // Then save study record (summary)
  await studyService.addRecord({ type, score, ... })
}
```

**Important:** `console.log` is stripped in production builds. Use `Taro.showToast` for debugging that persists.

### Database Collections

| Collection | Purpose | Permissions |
|------------|---------|-------------|
| users | User profiles | Owner read/write |
| questions_bank | Question bank (5000+ K12 questions) | Public read |
| study_records | Learning session summaries | Owner read/write |
| answer_history | Individual answer records | Owner read/write |
| favorites | Favorited questions | Owner read/write |
| chat_history | AI chat history | Owner read/write |
| vocabulary | Vocabulary data | Public read |
| idioms | Idiom data | Public read |
| word_favorites | Favorited words | Owner read/write |

### Page Routes

**TabBar Pages:** `home`, `exercise`, `chat`, `profile`

**Key Pages:**
- `login` - Entry point, requires user agreement checkbox
- `vocabulary`/`idiom`/`pinyin`/`correction` - Practice pages with answer saving
- `exercise-detail` - Generic practice detail page (supports `mode=wrong`, `mode=favorite`)
- `wrong-practice` - Shows错题 from `answer_history`
- `favorite-practice` - Shows favorited questions
- `study-record`/`study-report`/`study-analysis` - Learning statistics
- `admin`/`admin/user-detail` - Admin pages (admin check in cloud function)

### Important Constants

From `src/utils/constants.js`:
- `QUESTION_TYPES` - Single choice, multiple choice, fill blank, judge, essay
- `STUDY_TYPES` - vocabulary, literature, idiom, pinyin, correction, exercise, mock_exam
- `DIFFICULTY_LEVELS` - easy, medium, hard
- `CLOUD_FUNCTIONS` - LOGIN, USER, QUESTION, STUDY, CHAT, VOCABULARY
- `EVENTS` - Event bus event names

### Configuration Files

- `project.config.json` - WeChat Mini Program config (appid, cloudfunctionRoot, miniprogramRoot)
- `cloud.json` - Cloud development environment config
- `config/index.js` - Taro framework config (designWidth: 750, outputRoot: dist)
- `src/app.config.js` - Route registration and TabBar config

### Cloud Function Actions Reference

**question 云函数:**
| action | params | returns |
|--------|--------|--------|
| random | count, type, difficulty | Random questions |
| list | type, page, pageSize | Questions by type |
| submitBatch | answers[] | Save multiple answers to answer_history |
| wrong | page, pageSize | Get wrong questions |
| favorites | page, pageSize | Get favorited questions |
| removeWrong | questionId | Remove from wrong answers |
| adminCheck | - | Verify admin status |
| adminStats | - | Global statistics |
| adminUserList | page, pageSize | User list for admin |

**study 云函数:**
| action | params | returns |
|--------|--------|--------|
| getRecords | - | User's study records |
| addRecord | type, score, totalQuestions, etc. | Save study session |
| getReport | - | Generate study report |
| getAnalysis | - | Learning analysis |

### Critical Development Notes

1. **Cloud Init**: Must call `Taro.cloud.init()` before any cloud API usage (done in `app.jsx`)
2. **Build Output**: `dist/` directory is `miniprogramRoot`, must be set correctly in project.config.json
3. **Console Logging**: Stripped by minification in production. Use `Taro.showToast` for debugging.
4. **Cloud Function Deployment**: Code changes require redeployment via WeChat Developer Tools
5. **Practice Pages Must Save Answers**: Each practice page must call `question` cloud function with `action: 'submitBatch'` to save individual answers to `answer_history`
6. **Event Bus Cleanup**: Always return unsubscribe function from `eventBus.on()` in useEffect cleanup
7. **No Fake Data**: Services return empty arrays/objects on failure, not mock data

### Recent Bug Fixes (2025-01)

**Answer History Saving:**
- Practice pages now correctly call `question` cloud function with `submitBatch` action
- Each answer saved individually with `questionId`, `answer`, `isCorrect`, `questionType`
- `getWrongQuestions` now returns practice questions even if not in `questions_bank`

**Privacy Compliance:**
- Login page now requires explicit checkbox agreement to User Agreement and Privacy Policy
- Links to `user-agreement` and `privacy-policy` pages

**Navigation:**
- Chat page navigation uses `switchTab` instead of `navigateTo` (it's a TabBar page)
