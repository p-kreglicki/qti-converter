# CSV/Excel to QTI Converter with AI Enhancement - MVP Specification

## Product Overview

A privacy-first, AI-powered tool that converts assessment question banks from Excel/CSV format to QTI 2.1 standard, with intelligent quality enhancement and automatic PII protection for educational institutions.

https://www.1edtech.org/standards/qti/index - documentation reference

---

## Core Value Proposition

**For L&D Managers and Educational Institutions:**
- Convert legacy question banks to LMS-ready format in minutes (vs. hours of manual work)
- AI-enhanced quality validation catches errors and improves questions
- Privacy-first architecture with automatic PII detection and 24-hour data deletion
- Enterprise-grade compliance (GDPR, FERPA-aware) built-in from day one

**Key Differentiator:** "The only assessment converter that protects privacy as rigorously as it improves quality"

---

## Essential Features for V1 Launch

### 1. **File Input & Format Support**

**Supported Input Formats:**
- CSV (comma-separated values)
- Excel (.xlsx, .xls)
- Google Sheets (via CSV export)

**Expected Column Structure:**
```
Question | Answer_A | Answer_B | Answer_C | Answer_D | Correct_Answer | Explanation | Topic | Difficulty
```

**Smart Import Features:**
- Flexible column mapping interface (auto-detect common patterns)
- Support for multiple question types:
  - Multiple choice (4-6 options)
  - True/False
  - Short answer/essay prompts
  - Scenario-based questions
- Handles missing columns gracefully (e.g., no explanations provided)
- Batch upload (up to 1,000 questions per file)
- Template download (pre-formatted Excel with examples)

**File Validation:**
- Maximum file size: 10MB
- Maximum questions per upload: 1,000
- Format validation before processing
- Clear error messages for malformed data

---

### 2. **Privacy-First PII Detection & Protection**

**Automatic PII Scanning:**

**Three-Layer Detection System:**

**Layer 1: Fast Regex Screening (Immediate)**
- Email addresses: `user@domain.com` → `[EMAIL REDACTED]`
- Phone numbers: `555-123-4567` → `[PHONE REDACTED]`
- SSN/Student IDs: `123-45-6789` → `[ID REDACTED]`
- Common addresses pattern matching

**Layer 2: AI-Powered Deep Analysis (For Flagged Content)**
- Claude API analyzes context
- Identifies names in educational contexts
- Detects indirect identifiers (first name + school + grade)
- Suggests contextually appropriate replacements

**Layer 3: User Review & Approval**
- Side-by-side comparison (original vs. anonymized)
- Explain what was detected and why
- User approves changes before conversion
- Option to edit manually

**PII Detection Flow:**

```
Upload File
    ↓
Quick Regex Scan (< 1 second)
    ↓
┌─────────────────────────┐
│ No PII Detected?        │
│ ✓ Proceed to conversion │
└─────────────────────────┘
    ↓ [PII Detected]
AI Deep Analysis (5-10 seconds)
    ↓
User Review Screen:
┌──────────────────────────────────────┐
│ ⚠️ Potential PII Detected            │
│                                       │
│ Found in 12 questions:                │
│ • 8 person names (Sarah, John...)     │
│ • 2 email addresses                   │
│ • 1 phone number                      │
│ • 1 school name                       │
│                                       │
│ [View Details] [Preview Changes]      │
│                                       │
│ Suggested replacements:               │
│ "Sarah" → "Student A"                 │
│ "Lincoln High" → "[School Name]"      │
│                                       │
│ [ Apply & Convert ] [ Edit Manually ] │
│ [ Cancel ]                            │
│                                       │
│ ℹ️ Why this matters: Privacy policy   │
└──────────────────────────────────────┘
```

**Conversion Modes:**

- **Privacy Mode (Default):** Full PII detection + anonymization
- **Basic Mode:** Conversion only, no AI processing (for non-sensitive content)
- **Review Only:** Detection without auto-anonymization (user handles all changes)

**Limitations Disclosure:**

Clear messaging in UI:
```
"Our AI system detects common PII (names, emails, phone numbers, IDs) 
with high accuracy but is not 100% perfect. Always review sensitive 
files before uploading or use our Basic Mode for full manual control."
```

---

### 3. **AI-Powered Quality Enhancement**

**Quality Validation Checks:**

**A. Answer Key Validation**
- Verify correct answer is marked properly
- Check for multiple correct answers
- Flag ambiguous questions where multiple answers could be defended
- Explain reasoning: "Answer B is correct because [citation to source material]"

**B. Distractor Quality Analysis**
- Evaluate wrong answer plausibility
- Identify "throwaway" options (obviously wrong, grammatically inconsistent)
- Check for patterns (e.g., "all of the above" anti-pattern)
- Tag each distractor with misconception it represents
- Suggest improvements for weak distractors

**C. Clarity & Ambiguity Detection**
- Readability scoring (Flesch-Kincaid grade level)
- Double negative detection
- Ambiguous wording flags ("usually", "often", "best")
- Grammar and spelling check
- Grammatical parallelism in answer options

**D. Bloom's Taxonomy Classification**
- Auto-assign cognitive level (Remember → Create)
- Multi-factor analysis (not just verb matching)
- Verify question type matches claimed cognitive level
- Suggest reclassification if mismatch detected

**E. Bias & Accessibility Review**
- Cultural bias detection (US-centric references, idioms)
- Gender stereotype identification
- Name diversity check (Western name overrepresentation)
- Unnecessarily complex language flagging
- Visual accessibility notes (if images referenced)

**Quality Score Dashboard:**

After processing, display:
```
┌─────────────────────────────────────────┐
│ Quality Report: 247 Questions Analyzed  │
├─────────────────────────────────────────┤
│ Overall Score: 82/100 ⭐⭐⭐⭐           │
│                                         │
│ ✅ Excellent (150 questions)            │
│ ⚠️  Needs Review (85 questions)         │
│ ❌ Critical Issues (12 questions)       │
│                                         │
│ Common Issues Found:                    │
│ • 23 questions with weak distractors    │
│ • 12 questions with ambiguous wording   │
│ • 8 questions with potential bias       │
│ • 45 questions missing explanations     │
│                                         │
│ Bloom's Taxonomy Distribution:          │
│ [Visual chart showing distribution]     │
│                                         │
│ [View Detailed Report]                  │
│ [Fix Issues Automatically] [Review]     │
└─────────────────────────────────────────┘
```

**AI Enhancement Options:**

Users can choose enhancement level:
- **None:** Direct conversion, no AI analysis
- **Basic:** Validation only (flag issues, no suggestions)
- **Standard:** Validation + improvement suggestions (user applies)
- **Auto:** Full enhancement with automatic improvements (user reviews final)

**Opt-Out Control:**
Clear toggle: "Skip AI Enhancement (Privacy Mode - No Cloud Processing)"

---

### 4. **Interactive Question Editor**

**Editing Interface:**

- **Table view:** Spreadsheet-like for bulk editing
- **Card view:** Individual question focus for detailed work
- **Filter/sort:** By quality score, Bloom's level, detected issues
- **Bulk operations:** Apply changes to multiple questions

**Per-Question Actions:**

- Regenerate specific components (distractors, explanation, feedback)
- Manually adjust Bloom's taxonomy level
- Edit any field inline
- Preview how question appears to learners
- See AI reasoning for suggestions
- Accept/reject individual AI recommendations
- Add custom tags and metadata

**Undo/Redo:**
- Full change history per session
- Restore to original upload state
- Compare versions

---

### 5. **Export Capabilities**

**Primary Export: QTI 2.1 (LMS-Ready)**

**Format specifications:**
- Fully compliant QTI 2.1 XML
- Validated against 1EdTech schema
- ZIP package with manifest
- Includes metadata (difficulty, learning objectives, tags)
- Properly formatted assessment items with response processing

**LMS Compatibility Testing:**
Pre-launch validation with:
- ✅ Canvas LMS
- ✅ Moodle
- ✅ Brightspace (D2L)
- ✅ Blackboard Learn

**Additional Export Formats:**

1. **PDF (Formatted Document)**
   - Print-ready question bank
   - Includes answer key separately
   - Quality report appendix
   - Suitable for review/approval workflow

2. **CSV/Excel (Editable)**
   - Round-trip editing capability
   - Enhanced with AI suggestions as comments
   - Quality scores as additional columns
   - Import back for re-conversion

3. **Word Document (.docx)**
   - Formatted with styles
   - Table of contents
   - Answer key section
   - Quality notes

4. **JSON (Developer API)**
   - Structured data format
   - For custom integrations
   - Includes all metadata

**Export Options:**
- Include/exclude PII anonymization log
- Include/exclude quality report
- Include/exclude AI suggestions
- Custom metadata fields

---

### 6. **Data Security & Automatic Deletion**

**24-Hour Auto-Deletion Policy:**

**What Gets Deleted:**
- Uploaded source files (CSV/Excel)
- Converted QTI output files
- AI processing cache/logs
- PII detection reports
- Temporary processing data

**Retention Timeline:**
```
Upload → Process → Available for 24 hours → Auto-delete
         ↓
User can download during 24-hour window
         ↓
After 24 hours: PERMANENT DELETION
```

**User-Controlled Deletion:**
- "Delete Now" button on every conversion
- Bulk delete all conversions
- Account deletion removes all data immediately

**What's NOT Deleted (With Clear Disclosure):**
- User account information (email, name, subscription status)
- Usage analytics (anonymized/aggregated only)
- Audit logs (security monitoring - no question content)
- Database backups (7-day retention for disaster recovery only)

**Security Measures:**

**Data in Transit:**
- TLS 1.3 encryption
- HTTPS-only (no HTTP)
- Secure WebSocket for real-time updates

**Data at Rest:**
- AES-256 encryption
- Encrypted database backups
- Encrypted file storage

**Access Controls:**
- Multi-factor authentication (MFA) for accounts
- Role-based access (for team accounts)
- Session timeout (30 minutes inactive)
- IP allowlisting (Enterprise tier)

**Audit Logging:**
- All file uploads logged
- All conversions tracked
- All deletions recorded
- PII detection events logged
- Retention: 2 years (compliance requirement)
- No question content in logs

---

### 7. **Question Bank Management**

**Conversion History:**

Dashboard showing:
- Recent conversions (within 24-hour window)
- File name, upload date, question count
- Quality score summary
- Download buttons (all formats)
- Manual delete option
- Countdown to auto-deletion

**Organization Features:**

- Custom project names/labels
- Tags (topic, course, semester)
- Search within available conversions
- Favorites/bookmarks
- Notes/comments on conversions

**Basic Analytics:**

- Total questions converted (all-time)
- Most common quality issues
- Bloom's taxonomy trends across conversions
- PII detection frequency

**Limitations (Save for V2):**
- ❌ Long-term storage (by design - privacy-first)
- ❌ Version control across multiple conversions
- ❌ Collaborative editing
- ❌ Question bank merging

---

### 8. **Assessment Blueprint Tool**

**Bloom's Taxonomy Visualizer:**

Interactive chart showing:
- Current distribution across 6 levels
- Recommended distribution for assessment type
- Gap analysis (which objectives under-tested)
- Question count needed to balance

**Assessment Type Templates:**

Pre-configured distributions:
- **Formative Quiz:** 40% Remember/Understand, 40% Apply, 20% Analyze
- **Summative Exam:** 20% Remember, 30% Understand, 30% Apply, 20% Analyze/Evaluate
- **Certification Test:** 10% Remember, 20% Understand, 40% Apply, 30% Analyze/Evaluate/Create
- **Custom:** User defines target percentages

**Rebalancing Suggestions:**

```
┌─────────────────────────────────────────┐
│ Assessment Gap Analysis                  │
├─────────────────────────────────────────┤
│ Current: 247 questions                   │
│ Target: Summative Exam profile           │
│                                          │
│ Gaps Identified:                         │
│ • Need 15 more "Apply" questions         │
│ • Need 8 more "Analyze" questions        │
│ • Too many "Remember" (reduce by 12)     │
│                                          │
│ Suggestions:                             │
│ • Convert 12 "Remember" to "Apply"       │
│ • Add 8 scenario-based questions         │
│                                          │
│ [Auto-Suggest Questions] [Import More]   │
└─────────────────────────────────────────┘
```

**Learning Objective Coverage:**

- Import learning objectives list
- Map questions to objectives
- Identify untested objectives
- Flag over-tested areas

---

### 9. **User Onboarding & Education**

**First-Time User Experience:**

1. **Welcome Screen:** Product tour (2 minutes)
2. **Template Download:** Pre-filled example file
3. **Sample Conversion:** Process example file to see features
4. **Interactive Tutorial:** Guided walkthrough
5. **Documentation Hub:** Always accessible

**Educational Content:**

- **Video Tutorials:**
  - "Getting Started" (3 min)
  - "Understanding PII Protection" (5 min)
  - "Quality Enhancement Features" (7 min)
  - "Exporting to Your LMS" (4 min)

- **Written Guides:**
  - Formatting your Excel file
  - PII detection explained
  - Bloom's taxonomy guide
  - LMS-specific import instructions
  - Troubleshooting common issues

- **Templates Library:**
  - Excel template (blank)
  - Sample question bank (100 questions)
  - Best practices checklist
  - Quality rubric for manual review

**Help Center:**
- Searchable knowledge base
- FAQ section
- Live chat support (business hours)
- Email support ticket system

---

### 10. **Compliance & Legal Framework**

**Required Legal Documentation:**

**A. Privacy Policy**

Key sections:
- Data collection (what, why, how long)
- PII detection process and limitations
- 24-hour auto-deletion commitment
- Subprocessor disclosure (with links)
- User rights (access, deletion, correction)
- Cookie policy
- International data transfers
- Contact information for privacy requests

**B. Terms of Service**

Key clauses:
- **User Responsibilities:**
  ```
  Users must not upload files containing PII of minors without proper 
  authorization. While we provide automated PII detection and anonymization, 
  users remain responsible for ensuring compliance with applicable privacy 
  laws before upload.
  ```

- **Acceptable Use Policy:**
  - No malicious content
  - No copyrighted test materials without authorization
  - No attempt to reverse-engineer AI systems

- **Data Ownership:**
  - User retains all rights to uploaded content
  - Limited license to process for service delivery
  - No training AI on user data

- **Limitation of Liability:**
  - Best-effort PII detection (not guaranteed 100%)
  - User assumes risk for sensitive content
  - Standard software warranty disclaimers

**C. Data Processing Agreement (DPA) Template**

For enterprise customers:
- Defines roles (school = controller, you = processor)
- Lists permitted processing activities
- Security measures detailed
- Subprocessor disclosure
- Breach notification process
- Data return/deletion on termination
- Audit rights

**D. Subprocessor List**

Maintained page listing:
1. Anthropic (Claude AI) - AI enhancement
2. Supabase - Database and storage
3. Vercel - Application hosting
4. Stripe - Payment processing
5. Upstash - Session management
6. Resend - Email delivery

Each with:
- Purpose
- Data processed
- Location
- Compliance certifications
- Link to their privacy policy

**Compliance Certifications Roadmap:**

**Launch (MVP):**
- Lawyer-reviewed privacy policy
- Terms of Service
- DPA template available
- Subprocessor DPAs signed

**Month 3-6:**
- Security audit completed
- Penetration testing report
- GDPR compliance review

**Month 6-12 (Enterprise Tier):**
- SOC 2 Type II certification
- FERPA compliance attestation
- Annual security assessment

---

## Privacy & Security Architecture

### **Data Flow Diagram**

```
User Upload
    ↓
[Client-Side Validation]
    ↓
[Encrypted Transfer - TLS 1.3]
    ↓
[Server: Temporary Storage - Supabase]
    ↓
┌──────────────────────────┐
│ PII Detection Pipeline   │
│ 1. Regex scan            │
│ 2. AI analysis (if needed)│
│ 3. User review           │
└──────────────────────────┘
    ↓
[Anonymized Content]
    ↓
┌──────────────────────────┐
│ Quality Enhancement      │
│ (Optional - User choice) │
│                          │
│ Claude API Call:         │
│ - Minimal context        │
│ - Single question/batch  │
│ - No PII sent            │
│ - No training commitment │
└──────────────────────────┘
    ↓
[QTI Generation]
    ↓
[Available for Download - 24 hours]
    ↓
[AUTO-DELETE after 24 hours]

Parallel Process:
└─> [Audit Log - No Content]
    └─> [Retained 2 years]
```

### **Claude API Integration - Non-Training Enforcement**

**Contractual Protections:**

1. **Use Anthropic API (Not Consumer Product)**
   - Commercial API terms apply
   - Explicit non-training commitment
   - Business-grade data handling

2. **Data Processing Agreement**
   - Obtained from Anthropic enterprise team
   - Specifies data not used for training
   - 30-day maximum retention for safety monitoring
   - GDPR-compliant terms

3. **Privacy Policy Disclosure**
   ```
   AI Processing:
   
   We use Anthropic's Claude AI to enhance question quality. When you 
   enable AI enhancement, question text is sent to Anthropic's API.
   
   Anthropic's Commitments:
   • Does NOT use API data to train or improve models
   • Retains data maximum 30 days for safety/abuse monitoring only
   • Does not share data with third parties
   • GDPR-compliant processing
   
   You can opt-out by selecting "Basic Conversion" mode.
   
   Full details: [Link to Anthropic Privacy Policy]
   ```

4. **Technical Implementation**
   ```javascript
   // Minimize data sent to Claude
   const enhanceQuestion = async (question) => {
     // Send only question text, not entire bank
     // No metadata, author info, timestamps
     const minimalContext = {
       question: question.text,
       answers: question.options,
       correctAnswer: question.correct
     };
     
     const response = await anthropic.messages.create({
       model: "claude-3-5-sonnet-20241022",
       messages: [{
         role: "user",
         content: buildPrompt(minimalContext)
       }]
     });
     
     // Log what was sent (audit trail)
     await auditLog.create({
       action: 'ai_enhancement',
       questionId: question.id,
       timestamp: Date.now(),
       // Note: No actual content logged
       metadata: { processedByAI: true }
     });
     
     return response;
   };
   ```

5. **Alternative Processing Options**
   - **Basic Mode:** No AI processing at all
   - **On-Premise Option (Future):** Self-hosted models for ultra-sensitive content
   - **AWS Bedrock (Future):** Claude via AWS infrastructure (data residency control)

---

## Pricing Model

### **Freemium Structure**

**Free Tier:**
- 50 questions/month conversion limit
- Basic PII detection (regex only)
- Standard quality checks
- QTI 2.1 export only
- 24-hour file retention
- Email support

**Pro Tier ($29/month):**
- Unlimited conversions
- Full AI-powered PII detection
- Complete quality enhancement suite
- All export formats (QTI, PDF, CSV, Word, JSON)
- Priority support
- Bloom's taxonomy analysis
- Assessment blueprint tool
- 10 saved templates

**Enterprise Tier ($199/month):**
- Everything in Pro
- Team collaboration (5+ seats)
- API access for integrations
- Custom subprocessor agreements
- Dedicated account manager
- SOC 2 compliance documentation
- SLA guarantees (99.9% uptime)
- On-premise deployment option (add-on)
- Human review service (add-on)
- Custom retention policies

**One-Time Options:**
- Pay-per-conversion: $5 per 100 questions (no subscription)
- Bulk conversion service: Custom pricing for 10,000+ questions

---

## Success Metrics

### **MVP Launch Goals (First 6 Months)**

**User Acquisition:**
- 200 total signups
- 80 paid conversions (40% conversion rate)
- $3,000 MRR

**Product Usage:**
- Average: 500 questions converted per user
- 65% use AI enhancement
- 85% user satisfaction (NPS > 50)

**Quality Metrics:**
- 95% QTI files successfully import to target LMS
- < 5% support tickets related to conversion errors
- < 2% PII detection false negatives (based on user reports)

**Technical Performance:**
- Conversion time: < 30 seconds for 100 questions
- PII detection: < 10 seconds for 100 questions
- 99.5% uptime
- Zero data breaches

---

## What's NOT in MVP (V2 Roadmap)

**Deferred Features:**

❌ **Long-term question bank storage** - By design (privacy-first)
❌ **Collaborative editing** - Multi-user real-time collaboration
❌ **Advanced question types** - Matching, ordering, hotspot, drag-drop
❌ **Reverse QTI import** - QTI → editable Excel (round-trip)
❌ **Question bank merging** - Combine multiple banks intelligently
❌ **Item difficulty calibration** - Requires performance data
❌ **Custom AI model fine-tuning** - Use base Claude for MVP
❌ **Mobile app** - Web-responsive only initially
❌ **Automated pilot testing** - Requires learner testing integration
❌ **Integration marketplace** - Direct LMS connectors (Canvas, Moodle APIs)
❌ **Translation services** - Multi-language question banks
❌ **Version control** - Track changes across conversions
❌ **White-labeling** - Reseller partnerships

---

## Technical Stack Summary

**Frontend:**
- Next.js 14 + TypeScript + shadcn/ui

**Backend:**
- Next.js API Routes (serverless)
- Node.js 20+

**Database:**
- PostgreSQL (Supabase)

**Storage:**
- Supabase Storage (encrypted)

**AI:**
- Anthropic Claude 3.5 Sonnet

**Queue:**
- Redis (Upstash) + BullMQ

**Infrastructure:**
- Vercel (hosting)
- Supabase (database + auth + storage)

**Payments:**
- Stripe

**Email:**
- Resend

**Monitoring:**
- Sentry (errors)
- Vercel Analytics (usage)

**Cost:** $46-66/month fixed + variable AI usage

---

## Development Timeline

### **Phase 1: Foundation (Weeks 1-4)**
- Set up infrastructure (Vercel, Supabase, Stripe)
- Build basic CSV/Excel parser
- Implement QTI 2.1 XML generator
- Create user authentication
- Basic file upload/download

### **Phase 2: Core Features (Weeks 5-8)**
- PII detection system (regex + AI)
- User review flow for PII
- Quality enhancement integration (Claude API)
- Question editor interface
- Export functionality (all formats)

### **Phase 3: Polish & Compliance (Weeks 9-12)**
- 24-hour auto-deletion system
- Audit logging
- Legal documentation (Privacy Policy, ToS, DPA)
- LMS compatibility testing
- Security hardening
- User onboarding flow

### **Phase 4: Launch Prep (Weeks 13-14)**
- Beta testing with 10 users
- Bug fixes and refinements
- Documentation and help center
- Marketing site
- Payment integration testing

**Total: 14 weeks (3.5 months) to launch-ready MVP**

---

## Launch Strategy

**Week 1-2: Private Beta**
- 5-10 L&D managers from network
- Collect detailed feedback
- Fix critical bugs
- Validate pricing

**Week 3-4: Public Beta**
- Open signups with waitlist
- Limited to 50 users
- Aggressive iteration based on feedback
- Build case studies

**Week 5: Official Launch**
- Product Hunt launch
- LinkedIn/Twitter announcement
- Educational community outreach (Reddit, forums)
- Content marketing (blog posts, guides)

**Marketing Budget: $5,000**
- Google Ads: $2,000 (keywords: "QTI converter", "LMS migration")
- Content creation: $1,500 (SEO articles, video tutorials)
- PR/outreach: $1,000 (educational publications)
- Tools/subscriptions: $500 (email marketing, analytics)

---

## Risk Mitigation

### **Technical Risks**

**Risk:** PII detection isn't 100% accurate
- **Mitigation:** Clear user warnings, multiple detection layers, user review required

**Risk:** QTI files don't import correctly to LMS
- **Mitigation:** Pre-launch testing across 4 major LMS platforms, validation against schema

**Risk:** AI costs spiral out of control
- **Mitigation:** Tiered enhancement, caching, usage limits per tier

### **Legal Risks**

**Risk:** Privacy regulation violation (GDPR/FERPA)
- **Mitigation:** Lawyer review, DPAs with subprocessors, 24-hour deletion, clear disclosures

**Risk:** User uploads copyrighted test material
- **Mitigation:** ToS clause, DMCA compliance process, not liable for user content

**Risk:** Data breach
- **Mitigation:** Encryption everywhere, minimal data retention, breach response plan, cyber insurance

### **Business Risks**

**Risk:** LMS vendors build this feature natively
- **Mitigation:** Focus on multi-platform support, superior AI quality, privacy differentiation

**Risk:** Users don't see value of AI enhancement
- **Mitigation:** Free tier to demonstrate value, clear before/after examples, quality score visualization

**Risk:** Enterprise sales cycle too long
- **Mitigation:** Self-serve Pro tier generates revenue while pursuing enterprise deals

---

## Competitive Positioning

**Tagline:** "The smart, private way to modernize your assessment question banks"

**Key Messages:**

1. **Privacy-First Architecture**
   - "Your questions, gone in 24 hours. Zero long-term storage."
   - "Built for GDPR and FERPA compliance from day one"

2. **AI-Enhanced Quality**
   - "From Excel chaos to LMS-ready excellence in minutes"
   - "Catch errors before learners do"

3. **Universal Compatibility**
   - "Works with Canvas, Moodle, Brightspace, Blackboard, and more"
   - "Escape vendor lock-in with open standards"

4. **Educational Expertise**
   - "Built by educators, for educators"
   - "Bloom's taxonomy analysis included"

**Competitive Advantages:**
- ✅ Only converter with built-in PII protection
- ✅ AI quality enhancement (competitors are basic conversion)
- ✅ Privacy-first retention policy (24 hours)
- ✅ Transparent subprocessor disclosure
- ✅ Multiple export formats
- ✅ Assessment blueprint tool

---

## Investment Required

### **Total Year 1 Costs**

| Category | Amount |
|----------|--------|
| **Development** (14 weeks) | $20,000-35,000 |
| **Legal/Compliance** | $10,000-15,000 |
| **Infrastructure** (12 months) | $10,000 |
| **Marketing/Launch** | $5,000-10,000 |
| **Contingency (20%)** | $9,000-14,000 |
| **TOTAL** | **$54,000-84,000** |

### **Break-Even Analysis**

**Assumptions:**
- ARPU: $15/month (mix of free and paid)
- Paid conversion: 40%
- Operating costs: $800/month average

**Break-even:** 200 users (80 paid) = $2,400 MRR  
**Timeline:** Month 4-6 with consistent marketing

**Year 1 Revenue Projection (Conservative):**
- Month 6: $3,000 MRR
- Month 12: $10,000 MRR
- **Total Year 1:** ~$60,000 ARR

**Path to profitability:** Month 8-10

---

## Next Steps to Validate

### **Week 1: Demand Validation**
- [ ] Create landing page with "Coming Soon"
- [ ] Run $500 Google Ads campaign
- [ ] Target: 50+ email signups

### **Week 2: Willingness to Pay**
- [ ] Set up pre-order on Gumroad ($19 lifetime access)
- [ ] Email signups with offer
- [ ] Target: 5+ purchases

### **Week 3: Manual MVP**
- [ ] Offer manual conversion on Fiverr ($10 per 25 questions)
- [ ] Learn edge cases and pain points
- [ ] Document conversion process

**If validated → Begin development**

---

## Conclusion

This MVP balances **speed to market** with **privacy compliance** and **quality differentiation**.

**Key innovations:**
1. Privacy-first architecture (24-hour deletion)
2. Multi-layer PII protection
3. AI-enhanced quality validation
4. Transparent subprocessor relationships
5. Educational assessment expertise

**Core bet:** L&D managers will pay for a tool that solves migration pain while protecting their institution's privacy obligations.

**Timeline:** 3.5 months to launch  
**Investment:** $54K-84K  
**Break-even:** Month 8-10  

This is a focused, viable product that can launch quickly, generate revenue, and expand based on user feedback.