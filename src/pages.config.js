import Home from './pages/Home';
import Bookmarklet from './pages/Bookmarklet';
import HolidayGift from './pages/HolidayGift';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Bookmarklet": Bookmarklet,
    "HolidayGift": HolidayGift,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};