import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { toast, Toaster } from "sonner";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Copy,
  FileCheck2,
  FileKey2,
  HeartPulse,
  KeyRound,
  Landmark,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  api,
  API_BASE_URL,
  type CitizenProfile,
  type Domain,
  type RecordItem,
  type RegisterResponse,
  type SubIds,
  type VerifyResponse,
} from "./lib/api";
import "./index.css";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Landmark, path: "/" },
  { id: "register", label: "Register citizen", icon: UserRound, path: "/register" },
  { id: "issue", label: "Issue a record", icon: FileCheck2, path: "/issue" },
  { id: "share", label: "Share securely", icon: Send, path: "/share" },
  { id: "verify", label: "Verify record", icon: ClipboardCheck, path: "/verify" },
] as const;

type ViewId = (typeof navItems)[number]["id"];
type Language = "en" | "hi" | "bn" | "mr" | "pa";
type Translator = (key: string) => string;

const languageOptions: { value: Language; label: string; native: string }[] = [
  { value: "en", label: "English", native: "English" },
  { value: "hi", label: "Hindi", native: "हिन्दी" },
  { value: "bn", label: "Bengali", native: "বাংলা" },
  { value: "mr", label: "Marathi", native: "मराठी" },
  { value: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
];

const translations: Record<Language, Record<string, string>> = {
  en: {
    brandTagline: "My Identity", workspace: "Citizen workspace", dashboard: "Dashboard", register: "Register citizen", issue: "Issue a record", share: "Share securely", verify: "Verify record", connected: "Connected", sessionOnly: "Session only", private: "Private by design", privateNote: "Share only what you choose.", language: "Language", apiEndpoint: "API endpoint", apniPechan: "Apni Pechan",
  },
  hi: {
    brandTagline: "My Identity", workspace: "नागरिक कार्यक्षेत्र", dashboard: "डैशबोर्ड", register: "नागरिक पंजीकरण", issue: "रिकॉर्ड जारी करें", share: "सुरक्षित रूप से साझा करें", verify: "रिकॉर्ड सत्यापित करें", connected: "कनेक्टेड", sessionOnly: "सत्र", private: "गोपनीयता पहले", privateNote: "केवल वही साझा करें जिसे आप चुनें।", language: "भाषा", apiEndpoint: "API एंडपॉइंट", apniPechan: "अपनी पहचान",
  },
  bn: {
    brandTagline: "My Identity", workspace: "নাগরিক কর্মক্ষেত্র", dashboard: "ড্যাশবোর্ড", register: "নাগরিক নিবন্ধন", issue: "রেকর্ড জারি করুন", share: "নিরাপদে শেয়ার করুন", verify: "রেকর্ড যাচাই করুন", connected: "সংযুক্ত", sessionOnly: "সেশন", private: "গোপনীয়তা আগে", privateNote: "আপনি যা চান শুধু সেটিই শেয়ার করুন।", language: "ভাষা", apiEndpoint: "API এন্ডপয়েন্ট", apniPechan: "আপনি পেহচান",
  },
  mr: {
    brandTagline: "My Identity", workspace: "नागरिक कार्यक्षेत्र", dashboard: "डॅशबोर्ड", register: "नागरिक नोंदणी", issue: "रेकॉर्ड जारी करा", share: "सुरक्षितपणे शेअर करा", verify: "रेकॉर्ड पडताळा", connected: "जोडलेले", sessionOnly: "सत्र", private: "गोपनीयता प्रथम", privateNote: "तुम्ही निवडलेली माहितीच शेअर करा।", language: "भाषा", apiEndpoint: "API एंडपॉइंट", apniPechan: "आपली पेहचान",
  },
  pa: {
    brandTagline: "My Identity", workspace: "ਨਾਗਰਿਕ ਵਰਕਸਪੇਸ", dashboard: "ਡੈਸ਼ਬੋਰਡ", register: "ਨਾਗਰਿਕ ਰਜਿਸਟ੍ਰੇਸ਼ਨ", issue: "ਰਿਕਾਰਡ ਜਾਰੀ ਕਰੋ", share: "ਸੁਰੱਖਿਅਤ ਤਰੀਕੇ ਨਾਲ ਸਾਂਝਾ ਕਰੋ", verify: "ਰਿਕਾਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ", connected: "ਜੁੜਿਆ ਹੋਇਆ", sessionOnly: "ਸੈਸ਼ਨ", private: "ਪਰਦੇਦਾਰੀ ਪਹਿਲਾਂ", privateNote: "ਸਿਰਫ਼ ਉਹੀ ਸਾਂਝਾ ਕਰੋ ਜੋ ਤੁਸੀਂ ਚੁਣੋ।", language: "ਭਾਸ਼ਾ", apiEndpoint: "API ਐਂਡਪੋਇੰਟ", apniPechan: "ਅਪਨੀ ਪਹਿਚਾਣ",
  },
};

type DomainMeta = {
  label: string;
  short: string;
  icon: typeof BookOpen;
  color: string;
  tint: string;
};

const contextTranslations: Record<Language, Record<string, string>> = {
  en: { oneIdentity: "One identity. Many proofs.", rootAnchor: "Your root ID is the anchor for every record.", registerTitle: "Register a citizen", registerDesc: "Create a portable identity that can hold verified records across the domains that matter.", citizenDetails: "Citizen details", createIdentity: "Create identity", dashboardWelcome: "Welcome to Apni Pechan", dashboardDesc: "Register a citizen to create a root identity and start collecting verified records.", rootIdentity: "Root identity", profileSummary: "Profile summary", yourSubIds: "Your Sub-IDs", issuedRecords: "Issued records", issueTitle: "Issue an institution record", issueDesc: "Attach a signed record to the citizen's domain-specific identity.", shareTitle: "Share a record securely", shareDesc: "Create a time-limited code for one verifier and one record.", verifyTitle: "Verify a shared record", verifyDesc: "Check whether a consent code is valid and view the approved record summary.", fullName: "Full name", dob: "Date of birth", institution: "Institution name", recordTitle: "Record title", recordContent: "Record content", generateCode: "Generate share code", verifyButton: "Verify record" },
  hi: { oneIdentity: "एक पहचान। कई प्रमाण।", rootAnchor: "आपकी रूट आईडी हर रिकॉर्ड का आधार है।", registerTitle: "नागरिक पंजीकरण", registerDesc: "महत्वपूर्ण क्षेत्रों के सत्यापित रिकॉर्ड रखने वाली पोर्टेबल पहचान बनाएं।", citizenDetails: "नागरिक विवरण", createIdentity: "पहचान बनाएं", dashboardWelcome: "अपनी पहचान में आपका स्वागत है", dashboardDesc: "रूट पहचान बनाने और सत्यापित रिकॉर्ड जोड़ने के लिए नागरिक पंजीकृत करें।", rootIdentity: "रूट पहचान", profileSummary: "प्रोफ़ाइल सारांश", yourSubIds: "आपकी सब-आईडी", issuedRecords: "जारी रिकॉर्ड", issueTitle: "संस्था का रिकॉर्ड जारी करें", issueDesc: "नागरिक की डोमेन-विशिष्ट पहचान से हस्ताक्षरित रिकॉर्ड जोड़ें।", shareTitle: "रिकॉर्ड सुरक्षित रूप से साझा करें", shareDesc: "एक सत्यापनकर्ता और एक रिकॉर्ड के लिए समय-सीमित कोड बनाएं।", verifyTitle: "साझा रिकॉर्ड सत्यापित करें", verifyDesc: "सहमति कोड की वैधता जांचें और स्वीकृत रिकॉर्ड सारांश देखें।", fullName: "पूरा नाम", dob: "जन्म तिथि", institution: "संस्था का नाम", recordTitle: "रिकॉर्ड शीर्षक", recordContent: "रिकॉर्ड विवरण", generateCode: "शेयर कोड बनाएं", verifyButton: "रिकॉर्ड सत्यापित करें" },
  bn: { oneIdentity: "এক পরিচয়। অনেক প্রমাণ।", rootAnchor: "আপনার রুট আইডি প্রতিটি রেকর্ডের ভিত্তি।", registerTitle: "নাগরিক নিবন্ধন", registerDesc: "গুরুত্বপূর্ণ ক্ষেত্রের যাচাইকৃত রেকর্ড রাখার জন্য বহনযোগ্য পরিচয় তৈরি করুন।", citizenDetails: "নাগরিকের বিবরণ", createIdentity: "পরিচয় তৈরি করুন", dashboardWelcome: "আপনি পেহচানে স্বাগতম", dashboardDesc: "রুট পরিচয় তৈরি করতে এবং যাচাইকৃত রেকর্ড যোগ করতে নাগরিক নিবন্ধন করুন।", rootIdentity: "রুট পরিচয়", profileSummary: "প্রোফাইল সারাংশ", yourSubIds: "আপনার সাব-আইডি", issuedRecords: "জারি করা রেকর্ড", issueTitle: "প্রতিষ্ঠানের রেকর্ড জারি করুন", issueDesc: "নাগরিকের ডোমেন-ভিত্তিক পরিচয়ে স্বাক্ষরিত রেকর্ড যুক্ত করুন।", shareTitle: "নিরাপদে রেকর্ড শেয়ার করুন", shareDesc: "একজন যাচাইকারী ও একটি রেকর্ডের জন্য সময়সীমাবদ্ধ কোড তৈরি করুন।", verifyTitle: "শেয়ার করা রেকর্ড যাচাই করুন", verifyDesc: "সম্মতি কোডের বৈধতা পরীক্ষা করে অনুমোদিত সারাংশ দেখুন।", fullName: "পুরো নাম", dob: "জন্ম তারিখ", institution: "প্রতিষ্ঠানের নাম", recordTitle: "রেকর্ডের শিরোনাম", recordContent: "রেকর্ডের বিবরণ", generateCode: "শেয়ার কোড তৈরি করুন", verifyButton: "রেকর্ড যাচাই করুন" },
  mr: { oneIdentity: "एक ओळख. अनेक पुरावे.", rootAnchor: "तुमची रूट आयडी प्रत्येक रेकॉर्डचा आधार आहे।", registerTitle: "नागरिक नोंदणी", registerDesc: "महत्त्वाच्या क्षेत्रांतील पडताळलेले रेकॉर्ड ठेवणारी पोर्टेबल ओळख तयार करा।", citizenDetails: "नागरिक तपशील", createIdentity: "ओळख तयार करा", dashboardWelcome: "आपली पेहचानमध्ये स्वागत आहे", dashboardDesc: "रूट ओळख तयार करण्यासाठी आणि पडताळलेले रेकॉर्ड जोडण्यासाठी नागरिकाची नोंदणी करा।", rootIdentity: "रूट ओळख", profileSummary: "प्रोफाइल सारांश", yourSubIds: "तुमच्या सब-आयडी", issuedRecords: "जारी केलेले रेकॉर्ड", issueTitle: "संस्थेचे रेकॉर्ड जारी करा", issueDesc: "नागरिकाच्या डोमेन-विशिष्ट ओळखीला स्वाक्षरी केलेले रेकॉर्ड जोडा।", shareTitle: "रेकॉर्ड सुरक्षितपणे शेअर करा", shareDesc: "एका पडताळणीकर्त्यासाठी आणि एका रेकॉर्डसाठी वेळेपुरता कोड तयार करा।", verifyTitle: "शेअर केलेले रेकॉर्ड पडताळा", verifyDesc: "संमती कोड वैध आहे का ते तपासा आणि मंजूर सारांश पहा।", fullName: "पूर्ण नाव", dob: "जन्मतारीख", institution: "संस्थेचे नाव", recordTitle: "रेकॉर्ड शीर्षक", recordContent: "रेकॉर्डचा तपशील", generateCode: "शेअर कोड तयार करा", verifyButton: "रेकॉर्ड पडताळा" },
  pa: { oneIdentity: "ਇੱਕ ਪਛਾਣ। ਕਈ ਸਬੂਤ।", rootAnchor: "ਤੁਹਾਡੀ ਰੂਟ ਆਈਡੀ ਹਰ ਰਿਕਾਰਡ ਦਾ ਆਧਾਰ ਹੈ।", registerTitle: "ਨਾਗਰਿਕ ਰਜਿਸਟ੍ਰੇਸ਼ਨ", registerDesc: "ਮਹੱਤਵਪੂਰਨ ਖੇਤਰਾਂ ਲਈ ਪ੍ਰਮਾਣਿਤ ਰਿਕਾਰਡ ਰੱਖਣ ਵਾਲੀ ਪੋਰਟੇਬਲ ਪਛਾਣ ਬਣਾਓ।", citizenDetails: "ਨਾਗਰਿਕ ਵੇਰਵੇ", createIdentity: "ਪਛਾਣ ਬਣਾਓ", dashboardWelcome: "ਅਪਨੀ ਪਹਿਚਾਣ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ", dashboardDesc: "ਰੂਟ ਪਛਾਣ ਬਣਾਉਣ ਅਤੇ ਪ੍ਰਮਾਣਿਤ ਰਿਕਾਰਡ ਜੋੜਨ ਲਈ ਨਾਗਰਿਕ ਰਜਿਸਟਰ ਕਰੋ।", rootIdentity: "ਰੂਟ ਪਛਾਣ", profileSummary: "ਪ੍ਰੋਫਾਈਲ ਸਾਰ", yourSubIds: "ਤੁਹਾਡੀਆਂ ਸਬ-ਆਈਡੀ", issuedRecords: "ਜਾਰੀ ਕੀਤੇ ਰਿਕਾਰਡ", issueTitle: "ਸੰਸਥਾ ਦਾ ਰਿਕਾਰਡ ਜਾਰੀ ਕਰੋ", issueDesc: "ਨਾਗਰਿਕ ਦੀ ਡੋਮੇਨ-ਵਿਸ਼ੇਸ਼ ਪਛਾਣ ਨਾਲ ਦਸਤਖ਼ਤ ਕੀਤਾ ਰਿਕਾਰਡ ਜੋੜੋ।", shareTitle: "ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਤਰੀਕੇ ਨਾਲ ਸਾਂਝਾ ਕਰੋ", shareDesc: "ਇੱਕ ਪੁਸ਼ਟੀਕਾਰ ਅਤੇ ਇੱਕ ਰਿਕਾਰਡ ਲਈ ਸਮਾਂ-ਸੀਮਤ ਕੋਡ ਬਣਾਓ।", verifyTitle: "ਸਾਂਝੇ ਕੀਤੇ ਰਿਕਾਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ", verifyDesc: "ਸਹਿਮਤੀ ਕੋਡ ਦੀ ਵੈਧਤਾ ਜਾਂਚੋ ਅਤੇ ਮਨਜ਼ੂਰ ਸਾਰ ਵੇਖੋ।", fullName: "ਪੂਰਾ ਨਾਮ", dob: "ਜਨਮ ਮਿਤੀ", institution: "ਸੰਸਥਾ ਦਾ ਨਾਮ", recordTitle: "ਰਿਕਾਰਡ ਸਿਰਲੇਖ", recordContent: "ਰਿਕਾਰਡ ਵੇਰਵਾ", generateCode: "ਸ਼ੇਅਰ ਕੋਡ ਬਣਾਓ", verifyButton: "ਰਿਕਾਰਡ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ" },
};


const detailTranslations: Record<Language, Record<string, string>> = {
  en: {
    primaryNavigation: "Primary navigation",
    toggleNavigation: "Toggle navigation",
    dateUnavailable: "Date not available",
    independentIssuer: "Independent issuer",
    untitledRecord: "Untitled record",
    noDescription: "No description provided.",
    signed: "Signed",
    copyFailed: "Could not copy to clipboard",
    copied: "copied",
    citizenCreated: "Citizen identity created",
    loadFailed: "Could not load citizen data.",
    registerBeforeIssue: "Register a citizen before issuing a record.",
    completeFields: "Complete every field before issuing this record.",
    signedRecordIssued: "Signed record issued",
    issueFailed: "Could not issue this record.",
    chooseSubId: "Choose a Sub-ID",
    rightDomain: "Keep the record in the right domain.",
    useSubId: "Use the Sub-ID that matches the nature of the record. This helps citizens share only the context a verifier needs.",
    detailsVisible: "These details will be visible to a verifier after consent.",
    citizenSubId: "Citizen Sub-ID",
    selectDomain: "Select the domain this record belongs to.",
    selectSubId: "Select a Sub-ID",
    signatureBackend: "Signature generated by backend",
    loadingSubIds: "Loading Sub-IDs…",
    domainSubId: "Domain Sub-ID",
    records: "records",
    record: "record",
    issueRecord: "Issue record",
    noRecords: "No records yet",
    noRecordsDesc: "When an institution issues a record to one of your Sub-IDs, it will appear here.",
    issueFirst: "Issue the first record",
    registerBeforeShare: "Register a citizen before sharing a record.",
    selectVerifier: "Select a record and enter the verifier's name.",
    consentGenerated: "Consent code generated",
    shareFailed: "Could not create a share code.",
    codesExpire: "Codes expire automatically after 24 hours.",
    recordToShare: "Record to share",
    selectedOnly: "Only the selected record will be visible.",
    selectRecord: "Select a record",
    verifierName: "Verifier name",
    selectedRecord: "Selected record",
    readyToShare: "Ready to share",
    temporaryCode: "Temporary consent code",
    giveCode: "Give this code to",
    expiresAfter: "It will expire 24 hours after it was created.",
    copyCode: "Copy code",
    consentLimited: "Consent is time-limited",
    generatingCode: "Generating code",
    codeHere: "Your code will appear here",
    codeHereDesc: "Select a record and tell us who will verify it. The code is generated by the backend.",
    noShareable: "No shareable records found",
    issueFirstShare: "Issue a record first, then return here to create a consent code.",
    verifyCode: "Enter a share code to verify.",
    verifyFailed: "Could not verify this share code.",
    pasteCode: "Paste the code exactly as received from the citizen.",
    shareCode: "Share code",
    noProfile: "No citizen profile is exposed",
    checkingCode: "Checking code",
    signatureConfirmed: "Signature confirmed",
    validRecord: "This record is valid.",
    validRecordDesc: "The consent code matched a signed record approved for this verification.",
    recordTitleLabel: "Record title",
    issuerLabel: "Issuer",
    domainLabel: "Domain",
    notProvided: "Not provided",
    verifiedBy: "Verified by Apni Pechan",
    verificationFailed: "Verification failed",
    invalidCode: "This code is not valid.",
    invalidCodeDesc: "It may be expired, already revoked, or not recognized by the backend. Ask the citizen for a new code.",
    tryAnother: "Try another code",
    verificationResult: "Verification result",
    verificationResultDesc: "A successful check will show the record title, issuer, and domain here.",
    privateToYou: "Private to you",
    rootId: "Root ID",
    loadingRecords: "Loading records…",
    tryAgain: "Try again",
    registrationNameError: "Enter the citizen's full name.",
    registrationDobError: "Choose a date of birth.",
    registrationFailed: "Registration failed. Try again.",
    sentFastApi: "Sent securely to FastAPI",
    shareCodeLabel: "Share code"
  },
  hi: {
    primaryNavigation: "मुख्य नेविगेशन",
    toggleNavigation: "नेविगेशन बदलें",
    dateUnavailable: "तारीख उपलब्ध नहीं",
    independentIssuer: "स्वतंत्र जारीकर्ता",
    untitledRecord: "बिना शीर्षक रिकॉर्ड",
    noDescription: "विवरण उपलब्ध नहीं।",
    signed: "हस्ताक्षरित",
    copyFailed: "क्लिपबोर्ड पर कॉपी नहीं हो सका",
    copied: "कॉपी किया गया",
    citizenCreated: "नागरिक पहचान बनाई गई",
    loadFailed: "नागरिक डेटा लोड नहीं हो सका।",
    registerBeforeIssue: "रिकॉर्ड जारी करने से पहले नागरिक पंजीकृत करें।",
    completeFields: "रिकॉर्ड जारी करने से पहले सभी फ़ील्ड भरें।",
    signedRecordIssued: "हस्ताक्षरित रिकॉर्ड जारी किया गया",
    issueFailed: "रिकॉर्ड जारी नहीं हो सका।",
    chooseSubId: "सब-आईडी चुनें",
    rightDomain: "रिकॉर्ड को सही क्षेत्र में रखें।",
    useSubId: "Use the Sub-ID that matches the nature of the record. This helps citizens share only the context a verifier needs.",
    detailsVisible: "सहमति के बाद ये विवरण सत्यापनकर्ता को दिखाई देंगे।",
    citizenSubId: "नागरिक सब-आईडी",
    selectDomain: "रिकॉर्ड का क्षेत्र चुनें।",
    selectSubId: "सब-आईडी चुनें",
    signatureBackend: "हस्ताक्षर बैकएंड ने बनाया",
    loadingSubIds: "सब-आईडी लोड हो रही हैं…",
    domainSubId: "क्षेत्र सब-आईडी",
    records: "रिकॉर्ड",
    record: "रिकॉर्ड",
    issueRecord: "रिकॉर्ड जारी करें",
    noRecords: "अभी कोई रिकॉर्ड नहीं",
    noRecordsDesc: "संस्था द्वारा जारी रिकॉर्ड यहां दिखाई देगा।",
    issueFirst: "पहला रिकॉर्ड जारी करें",
    registerBeforeShare: "रिकॉर्ड साझा करने से पहले नागरिक पंजीकृत करें।",
    selectVerifier: "रिकॉर्ड चुनें और सत्यापनकर्ता का नाम भरें।",
    consentGenerated: "सहमति कोड बनाया गया",
    shareFailed: "शेयर कोड नहीं बन सका।",
    codesExpire: "कोड 24 घंटे बाद अपने आप समाप्त हो जाते हैं।",
    recordToShare: "साझा करने का रिकॉर्ड",
    selectedOnly: "केवल चुना हुआ रिकॉर्ड दिखाई देगा।",
    selectRecord: "रिकॉर्ड चुनें",
    verifierName: "सत्यापनकर्ता का नाम",
    selectedRecord: "चुना हुआ रिकॉर्ड",
    readyToShare: "साझा करने के लिए तैयार",
    temporaryCode: "अस्थायी सहमति कोड",
    giveCode: "यह कोड दें",
    expiresAfter: "यह बनने के 24 घंटे बाद समाप्त होगा।",
    copyCode: "कोड कॉपी करें",
    consentLimited: "सहमति समय-सीमित है",
    generatingCode: "कोड बनाया जा रहा है",
    codeHere: "आपका कोड यहां दिखाई देगा",
    codeHereDesc: "रिकॉर्ड चुनें और बताएं कि कौन सत्यापन करेगा। कोड बैकएंड बनाता है।",
    noShareable: "साझा करने योग्य रिकॉर्ड नहीं मिला",
    issueFirstShare: "पहले रिकॉर्ड जारी करें, फिर सहमति कोड बनाएं।",
    verifyCode: "सत्यापन के लिए शेयर कोड दर्ज करें।",
    verifyFailed: "शेयर कोड सत्यापित नहीं हो सका।",
    pasteCode: "नागरिक से मिला कोड यहां चिपकाएं।",
    shareCode: "शेयर कोड",
    noProfile: "नागरिक की प्रोफ़ाइल उजागर नहीं होती",
    checkingCode: "कोड जांचा जा रहा है",
    signatureConfirmed: "हस्ताक्षर की पुष्टि हुई",
    validRecord: "यह रिकॉर्ड मान्य है।",
    validRecordDesc: "सहमति कोड इस सत्यापन के लिए स्वीकृत हस्ताक्षरित रिकॉर्ड से मेल खाता है।",
    recordTitleLabel: "रिकॉर्ड शीर्षक",
    issuerLabel: "जारीकर्ता",
    domainLabel: "क्षेत्र",
    notProvided: "उपलब्ध नहीं",
    verifiedBy: "अपनी पहचान द्वारा सत्यापित",
    verificationFailed: "सत्यापन विफल",
    invalidCode: "यह कोड मान्य नहीं है।",
    invalidCodeDesc: "कोड समाप्त या अमान्य हो सकता है। नागरिक से नया कोड मांगें।",
    tryAnother: "दूसरा कोड आज़माएं",
    verificationResult: "सत्यापन परिणाम",
    verificationResultDesc: "सफल जांच में रिकॉर्ड शीर्षक, जारीकर्ता और क्षेत्र यहां दिखेंगे।",
    privateToYou: "केवल आपके लिए निजी",
    rootId: "रूट आईडी",
    loadingRecords: "रिकॉर्ड लोड हो रहे हैं…",
    tryAgain: "फिर कोशिश करें",
    registrationNameError: "नागरिक का पूरा नाम दर्ज करें।",
    registrationDobError: "जन्म तिथि चुनें।",
    registrationFailed: "पंजीकरण विफल। फिर कोशिश करें।",
    sentFastApi: "FastAPI को सुरक्षित रूप से भेजा गया",
    shareCodeLabel: "शेयर कोड"
  },
  bn: {
    primaryNavigation: "Primary navigation",
    toggleNavigation: "Toggle navigation",
    dateUnavailable: "Date not available",
    independentIssuer: "Independent issuer",
    untitledRecord: "Untitled record",
    noDescription: "No description provided.",
    signed: "Signed",
    copyFailed: "Could not copy to clipboard",
    copied: "copied",
    citizenCreated: "Citizen identity created",
    loadFailed: "Could not load citizen data.",
    registerBeforeIssue: "Register a citizen before issuing a record.",
    completeFields: "Complete every field before issuing this record.",
    signedRecordIssued: "Signed record issued",
    issueFailed: "Could not issue this record.",
    chooseSubId: "Choose a Sub-ID",
    rightDomain: "Keep the record in the right domain.",
    useSubId: "Use the Sub-ID that matches the nature of the record. This helps citizens share only the context a verifier needs.",
    detailsVisible: "These details will be visible to a verifier after consent.",
    citizenSubId: "Citizen Sub-ID",
    selectDomain: "Select the domain this record belongs to.",
    selectSubId: "Select a Sub-ID",
    signatureBackend: "Signature generated by backend",
    loadingSubIds: "Loading Sub-IDs…",
    domainSubId: "Domain Sub-ID",
    records: "records",
    record: "record",
    issueRecord: "Issue record",
    noRecords: "No records yet",
    noRecordsDesc: "When an institution issues a record to one of your Sub-IDs, it will appear here.",
    issueFirst: "Issue the first record",
    registerBeforeShare: "Register a citizen before sharing a record.",
    selectVerifier: "Select a record and enter the verifier's name.",
    consentGenerated: "Consent code generated",
    shareFailed: "Could not create a share code.",
    codesExpire: "Codes expire automatically after 24 hours.",
    recordToShare: "Record to share",
    selectedOnly: "Only the selected record will be visible.",
    selectRecord: "Select a record",
    verifierName: "Verifier name",
    selectedRecord: "Selected record",
    readyToShare: "Ready to share",
    temporaryCode: "Temporary consent code",
    giveCode: "Give this code to",
    expiresAfter: "It will expire 24 hours after it was created.",
    copyCode: "Copy code",
    consentLimited: "Consent is time-limited",
    generatingCode: "Generating code",
    codeHere: "Your code will appear here",
    codeHereDesc: "Select a record and tell us who will verify it. The code is generated by the backend.",
    noShareable: "No shareable records found",
    issueFirstShare: "Issue a record first, then return here to create a consent code.",
    verifyCode: "Enter a share code to verify.",
    verifyFailed: "Could not verify this share code.",
    pasteCode: "Paste the code exactly as received from the citizen.",
    shareCode: "Share code",
    noProfile: "No citizen profile is exposed",
    checkingCode: "Checking code",
    signatureConfirmed: "Signature confirmed",
    validRecord: "This record is valid.",
    validRecordDesc: "The consent code matched a signed record approved for this verification.",
    recordTitleLabel: "Record title",
    issuerLabel: "Issuer",
    domainLabel: "Domain",
    notProvided: "Not provided",
    verifiedBy: "Verified by Apni Pechan",
    verificationFailed: "Verification failed",
    invalidCode: "This code is not valid.",
    invalidCodeDesc: "It may be expired, already revoked, or not recognized by the backend. Ask the citizen for a new code.",
    tryAnother: "Try another code",
    verificationResult: "Verification result",
    verificationResultDesc: "A successful check will show the record title, issuer, and domain here.",
    privateToYou: "Private to you",
    rootId: "Root ID",
    loadingRecords: "Loading records…",
    tryAgain: "Try again",
    registrationNameError: "Enter the citizen's full name.",
    registrationDobError: "Choose a date of birth.",
    registrationFailed: "Registration failed. Try again.",
    sentFastApi: "Sent securely to FastAPI",
    shareCodeLabel: "Share code"
  },
  mr: {
    primaryNavigation: "Primary navigation",
    toggleNavigation: "Toggle navigation",
    dateUnavailable: "Date not available",
    independentIssuer: "Independent issuer",
    untitledRecord: "Untitled record",
    noDescription: "No description provided.",
    signed: "Signed",
    copyFailed: "Could not copy to clipboard",
    copied: "copied",
    citizenCreated: "Citizen identity created",
    loadFailed: "Could not load citizen data.",
    registerBeforeIssue: "Register a citizen before issuing a record.",
    completeFields: "Complete every field before issuing this record.",
    signedRecordIssued: "Signed record issued",
    issueFailed: "Could not issue this record.",
    chooseSubId: "Choose a Sub-ID",
    rightDomain: "Keep the record in the right domain.",
    useSubId: "Use the Sub-ID that matches the nature of the record. This helps citizens share only the context a verifier needs.",
    detailsVisible: "These details will be visible to a verifier after consent.",
    citizenSubId: "Citizen Sub-ID",
    selectDomain: "Select the domain this record belongs to.",
    selectSubId: "Select a Sub-ID",
    signatureBackend: "Signature generated by backend",
    loadingSubIds: "Loading Sub-IDs…",
    domainSubId: "Domain Sub-ID",
    records: "records",
    record: "record",
    issueRecord: "Issue record",
    noRecords: "No records yet",
    noRecordsDesc: "When an institution issues a record to one of your Sub-IDs, it will appear here.",
    issueFirst: "Issue the first record",
    registerBeforeShare: "Register a citizen before sharing a record.",
    selectVerifier: "Select a record and enter the verifier's name.",
    consentGenerated: "Consent code generated",
    shareFailed: "Could not create a share code.",
    codesExpire: "Codes expire automatically after 24 hours.",
    recordToShare: "Record to share",
    selectedOnly: "Only the selected record will be visible.",
    selectRecord: "Select a record",
    verifierName: "Verifier name",
    selectedRecord: "Selected record",
    readyToShare: "Ready to share",
    temporaryCode: "Temporary consent code",
    giveCode: "Give this code to",
    expiresAfter: "It will expire 24 hours after it was created.",
    copyCode: "Copy code",
    consentLimited: "Consent is time-limited",
    generatingCode: "Generating code",
    codeHere: "Your code will appear here",
    codeHereDesc: "Select a record and tell us who will verify it. The code is generated by the backend.",
    noShareable: "No shareable records found",
    issueFirstShare: "Issue a record first, then return here to create a consent code.",
    verifyCode: "Enter a share code to verify.",
    verifyFailed: "Could not verify this share code.",
    pasteCode: "Paste the code exactly as received from the citizen.",
    shareCode: "Share code",
    noProfile: "No citizen profile is exposed",
    checkingCode: "Checking code",
    signatureConfirmed: "Signature confirmed",
    validRecord: "This record is valid.",
    validRecordDesc: "The consent code matched a signed record approved for this verification.",
    recordTitleLabel: "Record title",
    issuerLabel: "Issuer",
    domainLabel: "Domain",
    notProvided: "Not provided",
    verifiedBy: "Verified by Apni Pechan",
    verificationFailed: "Verification failed",
    invalidCode: "This code is not valid.",
    invalidCodeDesc: "It may be expired, already revoked, or not recognized by the backend. Ask the citizen for a new code.",
    tryAnother: "Try another code",
    verificationResult: "Verification result",
    verificationResultDesc: "A successful check will show the record title, issuer, and domain here.",
    privateToYou: "Private to you",
    rootId: "Root ID",
    loadingRecords: "Loading records…",
    tryAgain: "Try again",
    registrationNameError: "Enter the citizen's full name.",
    registrationDobError: "Choose a date of birth.",
    registrationFailed: "Registration failed. Try again.",
    sentFastApi: "Sent securely to FastAPI",
    shareCodeLabel: "Share code"
  },
  pa: {
    primaryNavigation: "Primary navigation",
    toggleNavigation: "Toggle navigation",
    dateUnavailable: "Date not available",
    independentIssuer: "Independent issuer",
    untitledRecord: "Untitled record",
    noDescription: "No description provided.",
    signed: "Signed",
    copyFailed: "Could not copy to clipboard",
    copied: "copied",
    citizenCreated: "Citizen identity created",
    loadFailed: "Could not load citizen data.",
    registerBeforeIssue: "Register a citizen before issuing a record.",
    completeFields: "Complete every field before issuing this record.",
    signedRecordIssued: "Signed record issued",
    issueFailed: "Could not issue this record.",
    chooseSubId: "Choose a Sub-ID",
    rightDomain: "Keep the record in the right domain.",
    useSubId: "Use the Sub-ID that matches the nature of the record. This helps citizens share only the context a verifier needs.",
    detailsVisible: "These details will be visible to a verifier after consent.",
    citizenSubId: "Citizen Sub-ID",
    selectDomain: "Select the domain this record belongs to.",
    selectSubId: "Select a Sub-ID",
    signatureBackend: "Signature generated by backend",
    loadingSubIds: "Loading Sub-IDs…",
    domainSubId: "Domain Sub-ID",
    records: "records",
    record: "record",
    issueRecord: "Issue record",
    noRecords: "No records yet",
    noRecordsDesc: "When an institution issues a record to one of your Sub-IDs, it will appear here.",
    issueFirst: "Issue the first record",
    registerBeforeShare: "Register a citizen before sharing a record.",
    selectVerifier: "Select a record and enter the verifier's name.",
    consentGenerated: "Consent code generated",
    shareFailed: "Could not create a share code.",
    codesExpire: "Codes expire automatically after 24 hours.",
    recordToShare: "Record to share",
    selectedOnly: "Only the selected record will be visible.",
    selectRecord: "Select a record",
    verifierName: "Verifier name",
    selectedRecord: "Selected record",
    readyToShare: "Ready to share",
    temporaryCode: "Temporary consent code",
    giveCode: "Give this code to",
    expiresAfter: "It will expire 24 hours after it was created.",
    copyCode: "Copy code",
    consentLimited: "Consent is time-limited",
    generatingCode: "Generating code",
    codeHere: "Your code will appear here",
    codeHereDesc: "Select a record and tell us who will verify it. The code is generated by the backend.",
    noShareable: "No shareable records found",
    issueFirstShare: "Issue a record first, then return here to create a consent code.",
    verifyCode: "Enter a share code to verify.",
    verifyFailed: "Could not verify this share code.",
    pasteCode: "Paste the code exactly as received from the citizen.",
    shareCode: "Share code",
    noProfile: "No citizen profile is exposed",
    checkingCode: "Checking code",
    signatureConfirmed: "Signature confirmed",
    validRecord: "This record is valid.",
    validRecordDesc: "The consent code matched a signed record approved for this verification.",
    recordTitleLabel: "Record title",
    issuerLabel: "Issuer",
    domainLabel: "Domain",
    notProvided: "Not provided",
    verifiedBy: "Verified by Apni Pechan",
    verificationFailed: "Verification failed",
    invalidCode: "This code is not valid.",
    invalidCodeDesc: "It may be expired, already revoked, or not recognized by the backend. Ask the citizen for a new code.",
    tryAnother: "Try another code",
    verificationResult: "Verification result",
    verificationResultDesc: "A successful check will show the record title, issuer, and domain here.",
    privateToYou: "Private to you",
    rootId: "Root ID",
    loadingRecords: "Loading records…",
    tryAgain: "Try again",
    registrationNameError: "Enter the citizen's full name.",
    registrationDobError: "Choose a date of birth.",
    registrationFailed: "Registration failed. Try again.",
    sentFastApi: "Sent securely to FastAPI",
    shareCodeLabel: "Share code"
  }
};

const benefitTranslations: Record<Language, Record<string, string>> = { en: { portable: "Portable", portableDesc: "Works across institutions and services.", selective: "Selective", selectiveDesc: "Share a record, not your whole profile.", verifiable: "Verifiable", verifiableDesc: "Every issued record carries a signature." }, hi: { portable: "पोर्टेबल", portableDesc: "संस्थाओं और सेवाओं में काम करता है।", selective: "चयनात्मक", selectiveDesc: "पूरी प्रोफ़ाइल नहीं, केवल रिकॉर्ड साझा करें।", verifiable: "सत्यापन योग्य", verifiableDesc: "हर रिकॉर्ड पर हस्ताक्षर होते हैं।" }, bn: { portable: "বহনযোগ্য", portableDesc: "বিভিন্ন প্রতিষ্ঠান ও পরিষেবায় কাজ করে।", selective: "নির্বাচিত", selectiveDesc: "পুরো প্রোফাইল নয়, শুধু রেকর্ড শেয়ার করুন।", verifiable: "যাচাইযোগ্য", verifiableDesc: "প্রতিটি রেকর্ডে স্বাক্ষর থাকে।" }, mr: { portable: "पोर्टेबल", portableDesc: "संस्था आणि सेवांमध्ये काम करते।", selective: "निवडक", selectiveDesc: "पूर्ण प्रोफाइल नाही, फक्त रेकॉर्ड शेअर करा।", verifiable: "पडताळता येणारे", verifiableDesc: "प्रत्येक रेकॉर्डवर स्वाक्षरी असते।" }, pa: { portable: "ਪੋਰਟੇਬਲ", portableDesc: "ਸੰਸਥਾਵਾਂ ਅਤੇ ਸੇਵਾਵਾਂ ਵਿੱਚ ਕੰਮ ਕਰਦੀ ਹੈ।", selective: "ਚੋਣਵਾਂ", selectiveDesc: "ਪੂਰੀ ਪ੍ਰੋਫਾਈਲ ਨਹੀਂ, ਸਿਰਫ਼ ਰਿਕਾਰਡ ਸਾਂਝਾ ਕਰੋ।", verifiable: "ਪੁਸ਼ਟੀਯੋਗ", verifiableDesc: "ਹਰ ਰਿਕਾਰਡ ਤੇ ਦਸਤਖ਼ਤ ਹੁੰਦੇ ਹਨ।" } };

const domainTranslations: Record<Language, Record<string, string>> = { en: { education: "Education", employment: "Employment", finance: "Finance", healthcare: "Healthcare", other: "Other record" }, hi: { education: "शिक्षा", employment: "रोज़गार", finance: "वित्त", healthcare: "स्वास्थ्य सेवा", other: "अन्य रिकॉर्ड" }, bn: { education: "শিক্ষা", employment: "কর্মসংস্থান", finance: "অর্থ", healthcare: "স্বাস্থ্যসেবা", other: "অন্যান্য রেকর্ড" }, mr: { education: "शिक्षण", employment: "रोजगार", finance: "वित्त", healthcare: "आरोग्यसेवा", other: "इतर रेकॉर्ड" }, pa: { education: "ਸਿੱਖਿਆ", employment: "ਰੋਜ਼ਗਾਰ", finance: "ਵਿੱਤ", healthcare: "ਸਿਹਤ ਸੇਵਾ", other: "ਹੋਰ ਰਿਕਾਰਡ" } };

const domainMeta: Record<string, DomainMeta> = {
  education: { label: "Education", short: "EDU", icon: BookOpen, color: "#0B3C74", tint: "#E9EEF5" },
  employment: { label: "Employment", short: "EMP", icon: BriefcaseBusiness, color: "#F58220", tint: "#FFF0E4" },
  finance: { label: "Finance", short: "FIN", icon: WalletCards, color: "#54627A", tint: "#E9EEF5" },
  healthcare: { label: "Healthcare", short: "HEA", icon: HeartPulse, color: "#1B7A43", tint: "#E7F4EC" },
};

const fallbackDomain: DomainMeta = {
  label: "Other record",
  short: "ID",
  icon: FileCheck2,
  color: "#4f6175",
  tint: "#eaf0f4",
};

function getDomainMeta(domain?: Domain, t?: Translator) {
  const key = String(domain || "").toLowerCase();
  const meta = domainMeta[key] || fallbackDomain;
  return t ? { ...meta, label: t(domainMeta[key] ? key : "other") } : meta;
}

function getRecordId(record: RecordItem) {
  return String(record.record_id || record.id || "");
}

function getIssuer(record: RecordItem) {
  if (record.institution_name) return record.institution_name;
  if (record.issuer) return record.issuer;
  if (typeof record.institution === "string") return record.institution;
  if (record.institution?.name) return record.institution.name;
  return "Independent issuer";
}

function formatDate(value?: string) {
  if (!value) return "Date not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function initialCitizenId() {
  try {
    return window.localStorage.getItem("apni_pechan.citizen_id") || window.localStorage.getItem("setuid.citizen_id") || "";
  } catch {
    return "";
  }
}

function initialLanguage(): Language {
  try {
    const stored = window.localStorage.getItem("apni_pechan.language") as Language | null;
    return stored && translations[stored] ? stored : "en";
  } catch {
    return "en";
  }
}

function LoadingLabel({ children = "Working" }: { children?: string }) {
  return <span className="loading-label"><Loader2 size={16} className="spin" /> {children}</span>;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied`);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <button className="icon-button" type="button" onClick={handleCopy} aria-label={`Copy ${label}`} title={`Copy ${label}`}>
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

function FieldError({ children }: { children?: string }) {
  return children ? <p className="field-error" role="alert"><TriangleAlert size={14} /> {children}</p> : null;
}

function TextField({ label, hint, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  return (
    <div className="field-group">
      <label htmlFor={props.id}>{label}</label>
      {hint && <span className="field-hint">{hint}</span>}
      <input className={error ? "input invalid" : "input"} {...props} />
      <FieldError>{error}</FieldError>
    </div>
  );
}

function TextAreaField({ label, hint, error, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string }) {
  return (
    <div className="field-group">
      <label htmlFor={props.id}>{label}</label>
      {hint && <span className="field-hint">{hint}</span>}
      <textarea className={error ? "input textarea invalid" : "input textarea"} {...props} />
      <FieldError>{error}</FieldError>
    </div>
  );
}

function DomainBadge({ domain, t }: { domain: Domain; t?: Translator }) {
  const meta = getDomainMeta(domain, t);
  const Icon = meta.icon;
  return <span className="domain-badge" style={{ color: meta.color, background: meta.tint }}><Icon size={13} /> {meta.label}</span>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: typeof FileKey2; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon size={22} /></div>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function RecordCard({ record, t }: { record: RecordItem; t?: Translator }) {
  const meta = getDomainMeta(record.domain, t);
  const Icon = meta.icon;
  return (
    <article className="record-card" style={{ "--record-color": meta.color, "--record-tint": meta.tint } as React.CSSProperties}>
      <div className="record-card-top">
        <div className="record-icon"><Icon size={19} /></div>
        <DomainBadge domain={record.domain} t={t} />
      </div>
      <div className="record-card-body">
        <h3>{record.title || (t ? t("untitledRecord") : "Untitled record")}</h3>
        <p className="record-issuer"><Building2 size={14} /> {getIssuer(record)}</p>
        <p className="record-content">{record.content || (t ? t("noDescription") : "No description provided.")}</p>
      </div>
      <div className="record-card-footer">
        <span>{formatDate(record.created_at)}</span>
        {record.signature && <span className="signature-state"><BadgeCheck size={14} /> {t ? t("signed") : "Signed"}</span>}
      </div>
    </article>
  );
}

function IdentityId({ label, value, subtle = false }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className={subtle ? "identity-id subtle" : "identity-id"}>
      <div><span>{label}</span><strong>{value || "—"}</strong></div>
      {value && <CopyButton value={value} label={label} />}
    </div>
  );
}

function App() {
  const [location, navigate] = useLocation();
  const [citizenId, setCitizenId] = useState(initialCitizenId);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const currentView: ViewId = location === "/register" ? "register" : location === "/issue" ? "issue" : location === "/share" ? "share" : location === "/verify" ? "verify" : "dashboard";
  const t = (key: string) => translations[language][key] || contextTranslations[language][key] || detailTranslations[language][key] || benefitTranslations[language][key] || domainTranslations[language][key] || translations.en[key] || contextTranslations.en[key] || detailTranslations.en[key] || benefitTranslations.en[key] || domainTranslations.en[key] || key;
  const navLabels: Record<ViewId, string> = { dashboard: t("dashboard"), register: t("register"), issue: t("issue"), share: t("share"), verify: t("verify") };
  const currentLabel = navLabels[currentView] || t("dashboard");

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);
    document.documentElement.lang = nextLanguage;
    try { window.localStorage.setItem("apni_pechan.language", nextLanguage); } catch { /* storage is optional */ }
  }

  async function loadCitizen(id = citizenId) {
    if (!id) return;
    setDataLoading(true);
    setDataError("");
    try {
      const [citizen, citizenRecords] = await Promise.all([api.getCitizen(id), api.getRecords(id)]);
      setProfile(citizen);
      setRecords(Array.isArray(citizenRecords) ? citizenRecords : []);
    } catch (error) {
      setDataError(error instanceof Error ? error.message : t("loadFailed"));
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (citizenId) void loadCitizen(citizenId);
  }, [citizenId]);

  function go(view: ViewId) {
    const item = navItems.find((navItem) => navItem.id === view);
    navigate(item?.path || "/");
    setMobileNavOpen(false);
  }

  function handleRegistered(response: RegisterResponse, name: string, dob: string) {
    const nextProfile: CitizenProfile = { ...response, name, dob };
    setProfile(nextProfile);
    setRecords([]);
    setCitizenId(response.citizen_id);
    try { window.localStorage.setItem("apni_pechan.citizen_id", response.citizen_id); } catch { /* storage is optional */ }
    toast.success(t("citizenCreated"));
    go("dashboard");
  }

  function renderView() {
    if (currentView === "register") return <RegisterPage onRegistered={handleRegistered} t={t} />;
    if (currentView === "issue") return <IssuePage citizenId={citizenId} profile={profile} onComplete={() => { void loadCitizen(); go("dashboard"); }} t={t} />;
    if (currentView === "share") return <SharePage records={records} citizenId={citizenId} t={t} />;
    if (currentView === "verify") return <VerifyPage t={t} />;
    return (
      <DashboardPage
        citizenId={citizenId}
        profile={profile}
        records={records}
        loading={dataLoading}
        error={dataError}
        onRefresh={() => void loadCitizen()}
        onNavigate={go}
        t={t}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className={mobileNavOpen ? "sidebar open" : "sidebar"}>
        <div className="brand-block">
          <div className="brand-mark logo-crop"><img src="/apni-pechan-logo.jpeg" alt="Apni Pechan fingerprint" /></div>
          <div><strong className="brand-name">{t("apniPechan")}</strong><span>{t("brandTagline")}</span></div>
        </div>
        <div className="workspace-label">{t("workspace")}</div>
        <nav className="main-nav" aria-label={t("primaryNavigation")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={currentView === item.id ? "nav-item active" : "nav-item"} type="button" onClick={() => go(item.id)}><Icon size={18} /><span>{navLabels[item.id]}</span>{currentView === item.id && <ChevronRight className="nav-arrow" size={16} />}</button>;
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><LockKeyhole size={16} /><div><strong>{t("private")}</strong><span>{t("privateNote")}</span></div></div>
          <div className="api-status"><span className="status-dot" /> {t("apiEndpoint")} <code>{API_BASE_URL.replace(/^https?:\/\//, "")}</code></div>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu-button" type="button" onClick={() => setMobileNavOpen((open) => !open)} aria-label={t("toggleNavigation")}><span /><span /><span /></button>
          <div className="breadcrumb"><span className="topbar-brand">{t("apniPechan")}</span><ChevronRight size={14} /><strong>{currentLabel}</strong></div>
          <div className="topbar-actions">
            <span className="live-pill"><span className="status-dot" /> {t("connected")}</span>
            <div className="language-control-inline"><label htmlFor="language-select">{t("language")}</label><select id="language-select" aria-label={t("language")} value={language} onChange={(event) => changeLanguage(event.target.value as Language)}>{languageOptions.map((option) => <option key={option.value} value={option.value}>{option.native} · {option.label}</option>)}</select></div>
            {citizenId ? <div className="citizen-chip"><span className="avatar"><UserRound size={15} /></span><span>{profile?.name || t("register")}</span></div> : <span className="guest-chip">{t("sessionOnly")}</span>}
          </div>
        </header>
        <main className="content-wrap">{renderView()}</main>
      </div>
      <Toaster position="bottom-right" toastOptions={{ className: "apni-pechan-toast" }} />
    </div>
  );
}

function RegisterPage({ onRegistered, t }: { onRegistered: (response: RegisterResponse, name: string, dob: string) => void; t: Translator }) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [errors, setErrors] = useState<{ name?: string; dob?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = t("registrationNameError");
    if (!dob) nextErrors.dob = t("registrationDobError");
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }
    setSubmitting(true);
    setErrors({});
    try {
      const response = await api.register({ name: name.trim(), dob });
      onRegistered(response, name.trim(), dob);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : t("registrationFailed") });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="form-page">
      <PageHeader eyebrow={t("oneIdentity")} title={t("registerTitle")} description={t("registerDesc")} />
      <div className="form-layout">
        <section className="intro-panel">
          <div className="intro-orbit logo-crop"><img className="blended-logo" src="/apni-pechan-logo.jpeg" alt="Apni Pechan fingerprint" /></div>
          <span className="eyebrow light">{t("oneIdentity")}</span>
          <h2>{t("rootAnchor")}</h2>
          <p>{t("rootAnchor")}</p>
          <div className="benefit-list">
            <div><span className="benefit-number">01</span><span><strong>{t("portable")}</strong><small>{t("portableDesc")}</small></span></div>
            <div><span className="benefit-number">02</span><span><strong>{t("selective")}</strong><small>{t("selectiveDesc")}</small></span></div>
            <div><span className="benefit-number">03</span><span><strong>{t("verifiable")}</strong><small>{t("verifiableDesc")}</small></span></div>
          </div>
        </section>
        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <div className="form-card-heading"><div className="mini-icon dark logo-crop"><img src="/apni-pechan-logo.jpeg" alt="" /></div><div><h2>{t("citizenDetails")}</h2><p>{t("registerDesc")}</p></div></div>
          <div className="form-fields">
            <TextField id="citizen-name" label={t("fullName")} placeholder="e.g. Aanya Sharma" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />
            <TextField id="citizen-dob" label={t("dob")} hint={t("registerDesc")} type="date" autoComplete="bday" value={dob} onChange={(event) => setDob(event.target.value)} error={errors.dob} />
          </div>
          {errors.form && <div className="form-error"><TriangleAlert size={17} /><span>{errors.form}</span></div>}
          <div className="form-card-footer"><span className="secure-note"><LockKeyhole size={14} /> {t("sentFastApi")}</span><button className="primary-button" type="submit" disabled={submitting}>{submitting ? <LoadingLabel>{t("createIdentity")}</LoadingLabel> : <>{t("createIdentity")} <ArrowRight size={16} /></>}</button></div>
        </form>
      </div>
    </div>
  );
}

function DashboardPage({ citizenId, profile, records, loading, error, onRefresh, onNavigate, t }: { citizenId: string; profile: CitizenProfile | null; records: RecordItem[]; loading: boolean; error: string; onRefresh: () => void; onNavigate: (view: ViewId) => void; t: Translator }) {
  const displayName = profile?.name || "Citizen";
  const subIds = profile?.sub_ids || {};
  const subIdEntries = Object.entries(subIds).filter(([, value]) => Boolean(value));

  if (!citizenId) {
    return <div className="form-page"><PageHeader eyebrow={t("workspace")} title={t("dashboardWelcome")} description={t("dashboardDesc")} /><div className="welcome-card"><div className="welcome-illustration"><div className="welcome-logo-frame"><img src="/apni-pechan-logo.jpeg" alt="Apni Pechan fingerprint" /></div></div><div><span className="eyebrow">{t("sessionOnly")}</span><h2>{t("registerTitle")}</h2><p>{t("dashboardDesc")}</p><button className="primary-button" type="button" onClick={() => onNavigate("register")}>{t("register")} <ArrowRight size={16} /></button></div></div><div className="dashboard-note"><ShieldCheck size={18} /><div><strong>{t("private")}</strong><span>{t("privateNote")}</span></div></div></div>;
  }

  return (
    <div className="dashboard-page">
      <PageHeader eyebrow={t("workspace")} title={`${t("dashboard")}, ${displayName.split(" ")[0]}.`} description={t("dashboardDesc")} action={<button className="secondary-button" type="button" onClick={onRefresh} disabled={loading}>{loading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />} {t("dashboard")}</button>} />
      {error && <div className="form-error page-alert"><TriangleAlert size={17} /><span>{error}</span><button type="button" onClick={onRefresh}>{t("tryAgain")}</button></div>}
      <section className="identity-overview">
        <div className="root-identity-card">
          <div className="root-card-top"><div className="mini-icon dark logo-crop"><img src="/apni-pechan-logo.jpeg" alt="Apni Pechan fingerprint" /></div><span className="verified-label"><BadgeCheck size={15} /> {t("rootIdentity")}</span></div>
          <span className="root-label">ROOT ID</span><strong className="root-id-value">{profile?.root_id || t("loadingRecords")}</strong><p>{t("rootId")} — {t("privateToYou")}</p>
          <div className="root-card-footer">{profile?.root_id && <CopyButton value={profile.root_id} label={t("rootId")} />}<span><LockKeyhole size={13} /> {t("privateToYou")}</span></div>
        </div>
        <div className="identity-summary-card"><div className="summary-heading"><div><span className="eyebrow">{t("profileSummary")}</span><h2>{displayName}</h2></div><div className="avatar large"><UserRound size={22} /></div></div><div className="profile-facts"><div><span>{t("dob")}</span><strong>{profile?.dob ? formatDate(profile.dob) : "—"}</strong></div><div><span>{t("register")}</span><strong className="mono truncate" title={citizenId}>{citizenId}</strong></div></div><div className="profile-status"><span className="status-dot" /> {t("connected")}</div></div>
      </section>

      <section className="section-block"><div className="section-heading"><div><span className="eyebrow">{t("workspace")}</span><h2>{t("yourSubIds")}</h2></div><span className="section-count">{subIdEntries.length || 0} issued</span></div><div className="subid-grid">{subIdEntries.length ? subIdEntries.map(([domain, value]) => { const meta = getDomainMeta(domain, t); const Icon = meta.icon; return <div className="subid-card" key={domain} style={{ "--domain-color": meta.color, "--domain-tint": meta.tint } as React.CSSProperties}><div className="subid-card-head"><div className="domain-icon"><Icon size={17} /></div><span>{meta.label}</span></div><strong className="mono">{value}</strong><div className="subid-card-foot"><span>{t("domainSubId")}</span><CopyButton value={String(value)} label={`${meta.label} Sub-ID`} /></div></div>; }) : <div className="inline-loading"><Loader2 size={18} className="spin" /> {t("loadingSubIds")}</div>}</div></section>

      <section className="section-block records-section"><div className="section-heading"><div><span className="eyebrow">{t("private")}</span><h2>{t("issuedRecords")}</h2></div><div className="heading-actions"><span className="section-count">{records.length} {records.length === 1 ? t("record") : t("records")}</span><button className="secondary-button compact" type="button" onClick={() => onNavigate("issue")}><FileCheck2 size={15} /> {t("issueRecord")}</button></div></div>{loading && !records.length ? <div className="records-loading"><Loader2 size={20} className="spin" /> Loading records…</div> : records.length ? <div className="records-grid">{records.map((record, index) => <RecordCard key={getRecordId(record) || index} record={record} t={t} />)}</div> : <EmptyState icon={FileKey2} title={t("noRecords")} description={t("noRecordsDesc")} action={<button className="text-button" type="button" onClick={() => onNavigate("issue")}>{t("issueFirst")} <ArrowRight size={15} /></button>} />}</section>
    </div>
  );
}

function IssuePage({ citizenId, profile, onComplete, t }: { citizenId: string; profile: CitizenProfile | null; onComplete: () => void; t: Translator }) {
  const entries = Object.entries(profile?.sub_ids || {}).filter(([, value]) => Boolean(value));
  const [subId, setSubId] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!subId && entries[0]?.[1]) setSubId(String(entries[0][1])); }, [profile?.sub_ids]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!citizenId) { setFormError(t("registerBeforeIssue")); return; }
    if (!subId || !institutionName.trim() || !title.trim() || !content.trim()) { setFormError(t("completeFields")); return; }
    setSubmitting(true); setFormError("");
    try {
      await api.issueRecord({ sub_id: subId, institution_name: institutionName.trim(), title: title.trim(), content: content.trim() });
      toast.success(t("signedRecordIssued"));
      onComplete();
    } catch (error) { setFormError(error instanceof Error ? error.message : t("issueFailed")); } finally { setSubmitting(false); }
  }

  return <div className="form-page"><PageHeader eyebrow={t("workspace")} title={t("issueTitle")} description={t("issueDesc")} /><div className="form-layout single-form-layout"><div className="form-context-card"><div className="context-number">01</div><div><span className="eyebrow">{t("chooseSubId")}</span><h2>{t("rightDomain")}</h2><p>{t("useSubId")}</p></div><div className="context-domain-list">{entries.map(([domain]) => { const meta = getDomainMeta(domain, t); const Icon = meta.icon; return <div key={domain}><span className="domain-icon" style={{ background: meta.tint, color: meta.color }}><Icon size={16} /></span><span>{meta.label}</span><ChevronRight size={15} /></div>; })}</div></div><form className="form-card" onSubmit={handleSubmit} noValidate><div className="form-card-heading"><div className="mini-icon amber"><Building2 size={18} /></div><div><h2>{t("recordContent")}</h2><p>{t("detailsVisible")}</p></div></div><div className="form-fields"><div className="field-group"><label htmlFor="sub-id">{t("citizenSubId")}</label><span className="field-hint">{t("selectDomain")}</span><select id="sub-id" className="input select" value={subId} onChange={(event) => setSubId(event.target.value)}><option value="">{t("selectSubId")}</option>{entries.map(([domain, value]) => <option key={domain} value={value}>{getDomainMeta(domain).label} · {String(value)}</option>)}</select></div><TextField id="institution-name" label={t("institution")} placeholder="e.g. National Institute of Design" value={institutionName} onChange={(event) => setInstitutionName(event.target.value)} /><TextField id="record-title" label={t("recordTitle")} placeholder="e.g. Bachelor of Design — 2025" value={title} onChange={(event) => setTitle(event.target.value)} /><TextAreaField id="record-content" label={t("recordContent")} hint={t("recordContent")} placeholder={t("recordContent")} rows={5} value={content} onChange={(event) => setContent(event.target.value)} /></div>{formError && <div className="form-error"><TriangleAlert size={17} /><span>{formError}</span></div>}<div className="form-card-footer"><span className="secure-note"><BadgeCheck size={14} /> {t("signatureBackend")}</span><button className="primary-button" type="submit" disabled={submitting}>{submitting ? <LoadingLabel>{t("issueRecord")}</LoadingLabel> : <>{t("issue")} <ArrowRight size={16} /></>}</button></div></form></div></div>;
}

function SharePage({ records, citizenId, t }: { records: RecordItem[]; citizenId: string; t: Translator }) {
  const shareableRecords = useMemo(() => records.filter((record) => getRecordId(record)), [records]);
  const [recordId, setRecordId] = useState("");
  const [verifierName, setVerifierName] = useState("");
  const [shareCode, setShareCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selected = shareableRecords.find((record) => getRecordId(record) === recordId);

  useEffect(() => { if (!recordId && shareableRecords[0]) setRecordId(getRecordId(shareableRecords[0])); }, [shareableRecords, recordId]);

  async function handleShare(event: React.FormEvent) {
    event.preventDefault();
    if (!citizenId) { setError(t("registerBeforeShare")); return; }
    if (!recordId || !verifierName.trim()) { setError(t("selectVerifier")); return; }
    setSubmitting(true); setError(""); setShareCode("");
    try { const response = await api.createShare({ record_id: recordId, verifier_name: verifierName.trim() }); setShareCode(response.share_code); toast.success(t("consentGenerated")); } catch (err) { setError(err instanceof Error ? err.message : "Could not create a share code."); } finally { setSubmitting(false); }
  }

  return <div className="form-page"><PageHeader eyebrow={t("private")} title={t("shareTitle")} description={t("shareDesc")} /><div className="share-layout"><form className="form-card" onSubmit={handleShare} noValidate><div className="form-card-heading"><div className="mini-icon purple"><Send size={18} /></div><div><h2>{t("generateCode")}</h2><p>{t("codesExpire")}</p></div></div><div className="form-fields"><div className="field-group"><label htmlFor="share-record">{t("recordToShare")}</label><span className="field-hint">{t("selectedOnly")}</span><select id="share-record" className="input select" value={recordId} onChange={(event) => setRecordId(event.target.value)}><option value="">{t("selectRecord")}</option>{shareableRecords.map((record) => <option key={getRecordId(record)} value={getRecordId(record)}>{record.title} · {getIssuer(record)}</option>)}</select></div><TextField id="verifier-name" label={t("verifierName")} placeholder="e.g. Priya from admissions" value={verifierName} onChange={(event) => setVerifierName(event.target.value)} /></div>{selected && <div className="selected-record"><div className="selected-record-icon"><FileCheck2 size={18} /></div><div><span>{t("selectedRecord")}</span><strong>{selected.title}</strong><small>{getIssuer(selected)} · {getDomainMeta(selected.domain, t).label}</small></div><CheckCircle2 size={18} /></div>}{error && <div className="form-error"><TriangleAlert size={17} /><span>{error}</span></div>}<div className="form-card-footer"><span className="secure-note"><LockKeyhole size={14} /> {t("consentLimited")}</span><button className="primary-button" type="submit" disabled={submitting || !shareableRecords.length}>{submitting ? <LoadingLabel>{t("generatingCode")}</LoadingLabel> : <>{t("generateCode")} <ArrowRight size={16} /></>}</button></div></form><aside className={shareCode ? "share-result active" : "share-result"}>{shareCode ? <><div className="share-result-head"><div className="mini-icon teal"><KeyRound size={18} /></div><span className="verified-label"><CheckCircle2 size={15} /> {t("readyToShare")}</span></div><span className="eyebrow">{t("temporaryCode")}</span><div className="share-code">{shareCode}</div><p>{t("giveCode")} <strong>{verifierName}</strong>. {t("expiresAfter")}</p><div className="share-actions"><CopyButton value={shareCode} label={t("shareCodeLabel")} /><span>{t("copyCode")}</span></div><div className="expiry-note"><RefreshCw size={14} /> {t("expiresAfter")}</div></> : <EmptyState icon={KeyRound} title={t("codeHere")} description={t("codeHereDesc")} />}</aside></div>{!shareableRecords.length && <div className="dashboard-note"><FileKey2 size={18} /><div><strong>{t("noShareable")}</strong><span>{t("issueFirstShare")}</span></div></div>}</div>;
}

function VerifyPage({ t }: { t: Translator }) {
  const [shareCode, setShareCode] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (!shareCode.trim()) { setError(t("verifyCode")); return; }
    setSubmitting(true); setError(""); setResult(null);
    try { const response = await api.verifyShare({ share_code: shareCode.trim() }); setResult(response); } catch (err) { setError(err instanceof Error ? err.message : "Could not verify this share code."); } finally { setSubmitting(false); }
  }

  return <div className="form-page verify-page"><PageHeader eyebrow={t("verify")} title={t("verifyTitle")} description={t("verifyDesc")} /><div className="verify-layout"><form className="form-card" onSubmit={handleVerify} noValidate><div className="form-card-heading"><div className="mini-icon green"><ClipboardCheck size={18} /></div><div><h2>{t("verifyTitle")}</h2><p>{t("pasteCode")}</p></div></div><div className="verify-input-wrap"><TextField id="share-code" label={t("shareCodeLabel")} placeholder="e.g. SETU-84JQ-2K9P" autoCapitalize="characters" value={shareCode} onChange={(event) => setShareCode(event.target.value.toUpperCase())} /></div>{error && <div className="form-error"><TriangleAlert size={17} /><span>{error}</span></div>}<div className="form-card-footer"><span className="secure-note"><ShieldCheck size={14} /> {t("noProfile")}</span><button className="primary-button" type="submit" disabled={submitting}>{submitting ? <LoadingLabel>{t("checkingCode")}</LoadingLabel> : <>{t("verifyButton")} <ArrowRight size={16} /></>}</button></div></form><div className={result ? (result.valid ? "verification-result valid" : "verification-result invalid") : "verification-result"}>{result ? result.valid ? <><div className="result-status-icon"><CheckCircle2 size={26} /></div><span className="eyebrow">{t("signatureConfirmed")}</span><h2>{t("validRecord")}</h2><p>{t("validRecordDesc")}</p><div className="verified-facts"><div><span>{t("recordTitleLabel")}</span><strong>{result.title || t("notProvided")}</strong></div><div><span>{t("issuerLabel")}</span><strong>{result.issuer || t("notProvided")}</strong></div><div><span>{t("domainLabel")}</span><strong>{result.domain ? <DomainBadge domain={result.domain} t={t} /> : t("notProvided")}</strong></div></div><div className="verification-footer"><BadgeCheck size={15} /> {t("verifiedBy")}</div></> : <><div className="result-status-icon invalid-icon"><X size={26} /></div><span className="eyebrow">{t("verificationFailed")}</span><h2>{t("invalidCode")}</h2><p>{t("invalidCodeDesc")}</p><button className="secondary-button" type="button" onClick={() => { setResult(null); setShareCode(""); }}><RefreshCw size={15} /> {t("tryAnother")}</button></> : <EmptyState icon={ShieldCheck} title={t("verificationResult")} description={t("verificationResultDesc")} />}</div></div></div>;
}

export default App;
