import Home from './pages/Home';
import Bookmarklet from './pages/Bookmarklet';
import HolidayGift from './pages/HolidayGift';
import Enterprise from './pages/Enterprise';
import APIDocs from './pages/APIDocs';
import Support from './pages/Support';
import About from './pages/About';
import Contact from './pages/Contact';
import Careers from './pages/Careers';
import Learn from './pages/Learn';
import Blog from './pages/Blog';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Bookmarklet": Bookmarklet,
    "HolidayGift": HolidayGift,
    "Enterprise": Enterprise,
    "APIDocs": APIDocs,
    "Support": Support,
    "About": About,
    "Contact": Contact,
    "Careers": Careers,
    "Learn": Learn,
    "Blog": Blog,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};