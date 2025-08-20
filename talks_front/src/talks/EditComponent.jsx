import React,{ useState, useEffect, useRef } from 'react';
import { getSignedUrl, deleteImage , addArticle, getArticleById, getAllBoardsInformation, updateArticle} from './api/TalksApiService';
import './css/Edit.css'
import { useAuth } from './security/AuthContext'
import 'bootstrap';
import { Popover } from 'bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Dropdown from 'react-bootstrap/Dropdown';
import RuleModal from './RuleModal'
import { Modal, Button } from 'react-bootstrap';

export default function EditComponent() {

    const { articleId } = useParams() // 從 URL 中取得 articleId
    const [title, setTitle] = useState('');
    const articleEditorRef = useRef(null); // 文章頁面的 ref
    const authContext = useAuth()
    const username = authContext.username;
    const userId = authContext.userId;
    const [border, setBorder] = useState('Select posting board')
    const [boardId, setBoardId] = useState(null)
    const [allBoard, setAllBoard] = useState([])
    const navigate = useNavigate();

    const [showModal, setShowModal] = useState(false);
    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);


    useEffect(() => {
        if (articleId !== '-1') {
            loadArticle(articleId);
        } else {
            // 如果是新增文章，將編輯器初始化為空
            setTitle('');
            articleEditorRef.current.innerHTML = '';
            setBorder('Select posting board');
        }
    }, [articleId]);

    // 載入舊文章
    const loadArticle = async (id) => {
        try {
            const article = await getArticleById(id); // 調用 API 獲取文章
            console.log(article)
            setTitle(article.title);
            articleEditorRef.current.innerHTML = article.content;
            setBorder(article.board);
            setBoardId(article.boardId);
        } catch (error) {
            console.error('Failed to load article:', error);
        }
    };

    useEffect(() => {
        getAllBoard()
    }, []);

    // 取得所有看板資訊
    const getAllBoard = async () => {
        try {
            const boards = await getAllBoardsInformation(); 
            setAllBoard(boards)
        } catch (error) {
            console.error('Failed to get all board:', error);
        }
    };


    const handleFileUpload = async (event, editorRef) => {
        //取得圖片資料
        const file = event.target.files[0];

        if (file) {
            try {
                //上傳到aws
                const imageUrl = await getSignedUrl(file);
                console.log(imageUrl)

                // 將圖片插入到當前光標位置或指定位置
                const imgTag = `<p><img src="${imageUrl}" alt="Image" /></p>`;
                const editor = editorRef.current; // 獲取 editor 引用
                editor.innerHTML += imgTag;
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }
    };

    const handleTitleChange = (event) => {
        setTitle(event.target.value);
    };

    // 刪除aws上的圖片
    const handleKeyDown = async (event, editorRef) => {
        if (event.key === 'Backspace' || event.key === 'Delete') {
            const editor = editorRef.current;
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);
            let node = range.startContainer;
    
            // 如果節點是文本節點，移動到父節點
            if (node.nodeType === Node.TEXT_NODE) {
                node = node.parentNode;
            }
    
            // 在 node 中查找圖片元素
            const imgElement = node.querySelector('img'); // 查找 node 範圍內的 img 元素
    
            if (imgElement) {
                const imgUrl = imgElement.getAttribute('src');
                console.log('awsurl=' + imgUrl);
    
                try {
                    await deleteImage(imgUrl); // 等待後端刪除 AWS 上的圖片
                    imgElement.remove(); // 從 DOM 中移除圖片
                } catch (error) {
                    console.error('Failed to delete image:', error);
                }
            }
        }
    };

    // 處理拖曳進入虛線框區域的事件，阻止默認行為
    const handleDragOver = (event) => {
        event.preventDefault(); // 必須阻止默認行為，否則拖曳無法正常觸發
    };

    // 處理文件被拖放進虛線框區域的事件
    const handleDrop = (event) => {
        event.preventDefault(); // 同樣需要阻止默認行為
        const file = event.dataTransfer.files[0]; // 獲取拖放的文件
        if (file) {
            // 模擬將文件選擇器的文件設置為拖放的文件
            const input = document.getElementById('file-upload'); 
            const dataTransfer = new DataTransfer(); // 創建一個新的 DataTransfer 物件
            dataTransfer.items.add(file); // 將拖放的文件添加到 DataTransfer 物件中
            input.files = dataTransfer.files; // 將文件輸入框的文件設置為拖放的文件
            handleFileUpload({ target: input }, articleEditorRef); // 手動觸發文件上傳事件
        }
    };

    const handleSubmit= async(editorRef) => {
        const editorContent = editorRef.current.innerHTML; // 從 editorRef 獲取編輯器內容
        
        const article = {
            title : title,
            userId : userId,
            content : editorContent,
            boardId : boardId,
            board : border
        }

        try{
            //檢查是否已選擇看板
            if(border !== 'Select posting board' && title.trim() !== ''){

                if (articleId === '-1') {
                    // 將文章保存到數據庫
                    const result = await addArticle(article)
                } else {
                    article.articleId = articleId;
                    console.log(article)
                    await updateArticle(article)
                }

                alert('Post successful!')
                navigate('/mainPage')

            }else{
                let message = ''

                if(border === 'Select posting board'){
                    message = '請選擇看板！'
                }else if(title.trim() === ''){
                    message = '請輸入標題！'
                }else{
                    message = '請輸入內容'
                }

                alert(message)
            }

        }catch(error){
            console.error('fail to add article')
            throw error
        }
    }


    
    return (
        <div className='container-fuild'>
            <div className='container edit_container'>
                <div className='row'>

                    {/* 選項單 */}
                    <nav>
                        <div class="nav nav-tabs" id="nav-tab" role="tablist">
                            <button className="nav-link active edit_title" id="nav-home-tab" data-bs-toggle="tab" data-bs-target="#nav-home" type="button" role="tab" aria-controls="nav-home" aria-selected="true">Article</button>
                            <button className="nav-link edit_title" id="nav-profile-tab" data-bs-toggle="tab" data-bs-target="#nav-profile" type="button" role="tab" aria-controls="nav-profile" aria-selected="false">Image</button>
                        </div>
                    </nav>

                    {/* 選項一 : 文章 */}
                    <div className="tab-content" id="nav-tabContent">
                        <div className="tab-pane fade show active" id="nav-home" role="tabpanel" aria-labelledby="nav-home-tab">
                            <div className="d-flex mt-4 justify-content-between">

                                {/* 下拉選單 */}
                                <Dropdown>
                                    <Dropdown.Toggle variant="secondary" id="dropdown-basic" className='edit_button border-0 fs-5'>
                                        {border}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>
                                        {allBoard && allBoard.map((board) => (
                                            <Dropdown.Item
                                                key={board.boardName}
                                                href="#"
                                                onClick={() => {
                                                    setBorder(board.boardName); 
                                                    setBoardId(board.id);
                                                }}
                                            >
                                                {board.boardName}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>


                                <button 
                                    id="rulesButton" 
                                    type="button" 
                                    className='draft_color bg-transparent border-0 fs-5 btn' 
                                    data-bs-toggle="popover" 
                                    data-bs-placement="right" 
                                    title="Community Posting Rules"
                                    onClick={handleShowModal}
                                >
                                    <i class="bi bi-info-circle-fill me-2"></i>
                                    Rules
                                </button>
                                {/* rule模態視窗 */}
                                <RuleModal show={showModal} handleClose={handleCloseModal} />
                                
                            </div>

                            <div data-bs-spy="scroll" data-bs-target="#navbar-example2" data-bs-offset="0" className="scrollspy-example mt-4" tabIndex="0">
                                {/* 標題輸入框 */}
                                <input
                                    type="text" 
                                    className="form-control mb-3 fs-2 border-0" 
                                    value={title} 
                                    onChange={handleTitleChange} 
                                    placeholder="Enter title"
                                />
                                
                                {/* 內容輸入區域 */}
                                <div
                                    className="form-control mt-2 fs-5 border-0 edit_content"
                                    ref={articleEditorRef} // 綁定 editorRef 以便後續引用
                                    contentEditable="true" //使該區域內容可編輯
                                    style={{
                                        minHeight: '450px',
                                        padding: '10px',
                                        border: '1px solid #ccc',
                                        direction: 'ltr', // 強制設置文字方向從左到右
                                    }}
                                    onChange={(event) => handleFileUpload(event, articleEditorRef)} // 傳遞文章頁面的 ref
                                    onKeyDown={(event) => handleKeyDown(event, articleEditorRef)} // 傳遞圖片頁面的 ref
                                ></div>

                            </div>

                            <div className='row mt-3'>

                                {/* 上傳圖片 */}
                                <div className='col-auto'>
                                    {/* 隐藏文件输入框 */}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        id="file-upload" 
                                        style={{ display: 'none' }} 
                                        onChange={(event) => handleFileUpload(event, articleEditorRef)} 
                                    />

                                    {/* 图标按钮 */}
                                    <label htmlFor="file-upload" className="btn">
                                        <i className="bi bi-image edit_i"></i> 
                                    </label>
                                </div>

                                <div className='d-flex col-auto ms-auto align-items-center me-2'>
                                    <button type="button" className="btn btn-primary fs-3 edit_cancel border-0" onClick={() => navigate('/mainPage')}>cancel</button>
                                </div>

                                <div className='d-flex col-auto align-items-center'>
                                    <button type="button" className="btn btn-primary fs-3 px-4 edit_save" onClick={() => handleSubmit(articleEditorRef)}>save</button>
                                </div>

                            </div>

                        </div>

                        {/*  選項二 : 圖片 */}
                        <div class="tab-pane fade" id="nav-profile" role="tabpanel" aria-labelledby="nav-profile-tab">
                            <div className="d-flex mt-4 justify-content-between">

                                {/* 下拉選單 */}
                                <Dropdown>
                                    <Dropdown.Toggle variant="secondary" id="dropdown-basic" className='edit_button border-0 fs-5'>
                                        {border}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>
                                        {allBoard && allBoard.map((board) => (
                                            <Dropdown.Item
                                                key={board.boardName}
                                                href="#"
                                                onClick={() => {
                                                    setBorder(board.boardName); 
                                                    setBoardId(board.id);
                                                }}
                                            >
                                                {board.boardName}
                                            </Dropdown.Item>
                                        ))}
                                    </Dropdown.Menu>
                                </Dropdown>


                                <button 
                                    id="rulesButton" 
                                    type="button" 
                                    className='draft_color bg-transparent border-0 fs-5 btn' 
                                    data-bs-toggle="popover" 
                                    data-bs-placement="right" 
                                    title="Community Posting Rules"
                                    onClick={handleShowModal}
                                >
                                    <i class="bi bi-info-circle-fill me-2"></i>
                                    Rules
                                </button>
                                <RuleModal show={showModal} handleClose={handleCloseModal} />

                            </div>

                            <div data-bs-spy="scroll" data-bs-target="#navbar-example2" data-bs-offset="0" className="scrollspy-example mt-4" tabIndex="0">



                            </div>

                            <div className='row justify-content-center up_Area'>
                                {/* 隐藏文件输入框 */}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    id="file-upload" 
                                    style={{ display: 'none' }} 
                                    onChange={(event) => handleFileUpload(event, articleEditorRef)} 
                                />

                                {/* 图标按钮 */}
                                <label 
                                    htmlFor="file-upload" 
                                    id='uploadImg' 
                                    className="btn col-6 d-flex flex-column align-items-center justify-content-center dashed_border rounded-3 p-5"
                                    onDragOver={handleDragOver} // 監聽拖曳進入事件
                                    onDrop={handleDrop} // 監聽拖放事件
                                >
                                    {/* 上傳圖片 */}
                                    <h5>將圖片拖動到虛線框內</h5>
                                    <h5>或點擊虛線區域上傳圖片</h5>
                                    <i className="bi bi-image edit_i"></i> 
                                </label>
                            </div>

                        </div>
                    </div>
                </div>



            </div>
        </div>
    )
}
