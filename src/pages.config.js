import Home from './pages/Home';
import Bookmarklet from './pages/Bookmarklet';
import HolidayGift from './pages/HolidayGift';
import Enterprise from './pages/Enterprise';
import APIDocs from './pages/APIDocs';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Bookmarklet": Bookmarklet,
    "HolidayGift": HolidayGift,
    "Enterprise": Enterprise,
    "APIDocs": APIDocs,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};