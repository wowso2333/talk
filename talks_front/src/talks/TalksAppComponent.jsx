import {BrowserRouter, Routes, Route, Navigate, useLocation} from 'react-router-dom'
import React, { useEffect } from 'react';
import AuthProvider, { useAuth } from './security/AuthContext.js'
import LetStartComponent from './LetStartComponent.jsx'
import LoginComponent from './LoginComponent.jsx'
import MainPageComponent from './MainPageComponent.jsx'
import RegisterComponent from './RegisterCompetent.jsx'
import EditComponent from './EditComponent.jsx'
import HeaderComponent from './HeaderComponent.jsx'
import Try from './Try.jsx'
import PageCompotent from './PageComponent.jsx';
import ReadArticleComponent from './ReadArticleComponent.jsx';
import UpdateComponent from './UpdateComponent.jsx';
import AllBoardComponent from './AllBoardComponent.jsx';
import SearchResultComponent from './SearchResultComponent.jsx'
import DnonateSuccessComponent from './DnonateSuccessComponent.jsx'
import { trackPageView } from '../analytics.js'

function AnalyticsTracker() {
    const location = useLocation()

    useEffect(() => {
        trackPageView(location.pathname)
    }, [location.pathname])

    return null
}

function AuthenticatedRoute({children}) {
    const authContext = useAuth()
    
    if(authContext.isAuthenticated)
        return children

    return <Navigate to="/" />
}

function LayoutWithHeader({ children }) {
    const location = useLocation();  // 使用 useLocation 來檢查當前路徑
    const showHeader = !['/login', '/register', '/'].includes(location.pathname);  // 決定是否顯示 Header

    return (
        <>
            {showHeader && <HeaderComponent />}  {/* 只有當路徑不是 login 或 register 時才顯示 Header */}
            <div>{children}</div>
        </>
    );
}

export default function TalksAppComponent() {

    return (
        <div className="TodoApp">
            <AuthProvider>
                <BrowserRouter>
                    <AnalyticsTracker />
                    <LayoutWithHeader>
                        <Routes>
                            <Route path='/' element={ <LetStartComponent /> } />
                            <Route path='/login' element={ <LoginComponent /> } />
                            <Route path='/register' element={ <RegisterComponent /> } />

                            <Route path='/try' element={
                                <Try/>
                            } />

                            <Route path='/readArticle' element={
                                <ReadArticleComponent/>
                            } />
                            
                            <Route path='/mainPage' element={
                                <AuthenticatedRoute>
                                    <MainPageComponent/>
                                </AuthenticatedRoute> 
                            } />

                            <Route path='/edit/:articleId' element={
                                <AuthenticatedRoute>
                                    <div>
                                        <EditComponent/>
                                    </div>
                                </AuthenticatedRoute>
                            } />

                            <Route path='/page/:boardName' element={
                                <AuthenticatedRoute>
                                    <div>
                                        <PageCompotent/>
                                    </div>
                                </AuthenticatedRoute>
                            } />

                            <Route path='/update' element={
                                <AuthenticatedRoute>
                                    <div>
                                        <UpdateComponent/>
                                    </div>
                                </AuthenticatedRoute>
                            } />

                            <Route path='/allBoard' element={
                                <AuthenticatedRoute>
                                    <div>
                                        <AllBoardComponent/>
                                    </div>
                                </AuthenticatedRoute>
                            } />

                            <Route path="/search" element={
                                <AuthenticatedRoute>
                                    <div>
                                        <SearchResultComponent/>
                                    </div>
                                </AuthenticatedRoute>
                            } />

                            <Route path="/donate/success" element={
                                <AuthenticatedRoute>
                                    <div>
                                        <DnonateSuccessComponent/>
                                    </div>
                                </AuthenticatedRoute>
                            } />
                        </Routes>
                    </LayoutWithHeader>
                </BrowserRouter>
            </AuthProvider>
        </div>
    )
}
