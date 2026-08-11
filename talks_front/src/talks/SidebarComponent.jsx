import React, { useEffect, useState } from 'react';
import { FaStar } from 'react-icons/fa'; // 使用 react-icons 作為星星圖示
import { addFavoriteBoard, removeFavoriteBoard, getFavoriteBoardId, getRecommendBoardsInformation} from './api/TalksApiService';
import { useAuth } from './security/AuthContext';
import { useNavigate } from 'react-router-dom';
import './css/Sidebar.css'

export default function Sidebar( {fetchFavBoardArticles } ) {

    const authContext = useAuth();
    const userId = authContext.userId
    const navigate = useNavigate();
    const starredItems = authContext.starredItems
    const setStarredItems = authContext.setStarredItems

    const [sidebarList, setSidebarList] = useState([])

    
    useEffect(() => {
        try{
            //取得看板的名稱和圖片
            const setBoardInformation = async () => {
                const boardInformation = await getRecommendBoardsInformation(); 
                console.log(boardInformation); // 檢查資料格式
                if (Array.isArray(boardInformation)) {
                    setSidebarList(boardInformation);
                }
            }
            setBoardInformation()

        }catch(error){
            console.error('fail to get all board info')
        }

    }, [])

    useEffect(() => {
        try{

            //初始化星星狀態
            const initStar = async () => {
                const newStarItems = {}

                const favoriteBoardId = await getFavoriteBoardId(userId)  // 取得目前已追蹤看板

                if(Array.isArray(favoriteBoardId)){
                    favoriteBoardId.forEach(boardId => {
                        newStarItems[boardId] = true; // 將有追蹤的看板設為 true
                    });
                }

                setStarredItems(newStarItems) //更新狀態
            }

            initStar()
        }catch(error){
            console.error('fail to initStar')
        }

    }, [userId])


    // 收藏最愛看板  ＋ 移除最愛看板
    const handleStarClick = async (boardId) => {
        const isCurrentlyStarred = starredItems[boardId] || false;
        const newState = {
            ...starredItems,
            [boardId]: !isCurrentlyStarred, // 切換特定項目的點亮狀態
        };
    
        // 先更新星星狀態
        setStarredItems(newState);
    
        try {
            // 判斷是加入還是取消收藏，並呼叫相應的 API
            if (newState[boardId]) {
                await addFavoriteBoard(userId, boardId); // 新增最愛看板
                alert(`已加入追蹤名單`);     
            } else {
                await removeFavoriteBoard(userId, boardId); // 呼叫取消收藏的 API 方法，並等待完成
                alert(`已從追蹤名單移除`);
            }

            if(fetchFavBoardArticles){
                await fetchFavBoardArticles() // 更新追蹤看板的文章
            }
            
        } catch (error) {
            console.error('操作失敗:', error);

            // 如果操作失敗，恢復到之前的狀態
            setStarredItems(prevState => ({
                ...prevState,
                [boardId]: isCurrentlyStarred,
            }));
            alert(`${boardId} 操作失敗，請稍後再試`);
        }
    };

    return (
        <div className='sidebar fw-bold fs-5'>
            <div className='d-flex w-100 text-white p-2 align-items-center'>
                <i className="bi bi-clipboard2-minus-fill fs-1 me-3"></i>
                <button className='fw-bold m-0 fs-5 text-white mainPage_listButton' onClick={ () => navigate('/allBoard')}>All Board</button>
            </div>

            <div className='recommended_text ps-2 pt-3 pb-4'>
                Recommended
            </div>

            {sidebarList && sidebarList.map((img) => (
                <button
                className='row sidebar_button border-0 p-2 align-items-center'
                key = {img.boardName}
                >
                    <div className='col-10 d-flex'   onClick = { () => navigate(`/page/${img.boardName}`) }>
                        <img src={img.imgUrl} alt={img.boardName} className='mainPage_img rounded-circle me-3' />
                        <p className='text-white fw-bold fs-5 m-0'>{img.boardName}</p>
                    </div>
                    <div className="col-2 d-flex justify-content-end align-items-center">
                        <FaStar
                            className="sideBar_star"
                            style={{
                                cursor: 'pointer',
                                color: starredItems[img.id] ? 'rgb(132, 78, 240)' : 'rgb(41, 13, 97)'
                            }}
                            onClick={() => handleStarClick(img.id)}
                        />
                    </div>
                </button> 
            ))}
        </div>
    );
}
