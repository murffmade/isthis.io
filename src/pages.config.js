import APIDocs from './pages/APIDocs';
import About from './pages/About';
import Account from './pages/Account';
import Admin from './pages/Admin';
import BatchAnalysis from './pages/BatchAnalysis';
import Blog from './pages/Blog';
import Bookmarklet from './pages/Bookmarklet';
import Careers from './pages/Careers';
import Contact from './pages/Contact';
import Enterprise from './pages/Enterprise';
import EnterpriseMarketing from './pages/EnterpriseMarketing';
import GiftRedemption from './pages/GiftRedemption';
import History from './pages/History';
import HolidayGift from './pages/HolidayGift';
import Home from './pages/Home';
import Learn from './pages/Learn';
import MyGifts from './pages/MyGifts';
import PaymentSuccess from './pages/PaymentSuccess';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Safe from './pages/Safe';
import Scam from './pages/Scam';
import Support from './pages/Support';
import TermsOfService from './pages/TermsOfService';
import TrainerDashboard from './pages/TrainerDashboard';
import True from './pages/True';
import ModelPerformance from './pages/ModelPerformance';
import AnalysisDashboard from './pages/AnalysisDashboard';
import FeedbackQueue from './pages/FeedbackQueue';
import ContentGenerator from './pages/ContentGenerator';
import BlogEditor from './pages/BlogEditor';
import __Layout from './Layout.jsx';


export const PAGES = {
    "APIDocs": APIDocs,
    "About": About,
    "Account": Account,
    "Admin": Admin,
    "BatchAnalysis": BatchAnalysis,
    "Blog": Blog,
    "Bookmarklet": Bookmarklet,
    "Careers": Careers,
    "Contact": Contact,
    "Enterprise": Enterprise,
    "EnterpriseMarketing": EnterpriseMarketing,
    "GiftRedemption": GiftRedemption,
    "History": History,
    "HolidayGift": HolidayGift,
    "Home": Home,
    "Learn": Learn,
    "MyGifts": MyGifts,
    "PaymentSuccess": PaymentSuccess,
    "PrivacyPolicy": PrivacyPolicy,
    "Safe": Safe,
    "Scam": Scam,
    "Support": Support,
    "TermsOfService": TermsOfService,
    "TrainerDashboard": TrainerDashboard,
    "True": True,
    "ModelPerformance": ModelPerformance,
    "AnalysisDashboard": AnalysisDashboard,
    "FeedbackQueue": FeedbackQueue,
    "ContentGenerator": ContentGenerator,
    "BlogEditor": BlogEditor,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};