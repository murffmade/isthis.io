import Home from './pages/Home';
import Bookmarklet from './pages/Bookmarklet';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Bookmarklet": Bookmarklet,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};