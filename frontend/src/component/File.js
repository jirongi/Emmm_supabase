//룸에 있는 안건에 있는 파일 불러오기+ 확대
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import style from "../CSS/File.module.css";

import fileIcon from "../asset/icon-filelist.png";
import pdfIcon from "../asset/icon-pdf.png";
import fileCenterHoverbefore from "../asset/icon-emptyfileHoverbefore.png";
import fileCenterHoverafter from "../asset/icon-emptyfileHoverafter.png";
import { deleteFile, getFileUrls, getFiles, uploadFile } from "../api/files";
import { errorMessage } from "../api/errors";

const MAX_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/gif", "image/webp"];

function File({ isHost, roomId, userId, agendaId, onChange }) {
    const queryClient = useQueryClient();

    //파일 아이콘 호버
    const [iconFile, setIconFile] = useState(false);
    const [listModal, setListModal] = useState(false);
    const [chosenId, setChosenId] = useState(null);
    const [uploading, setUploading] = useState(false);

    // 삭제하기 버튼 상태값
    const [x, setX] = useState(null);

    const { data: files = [] } = useQuery({
        queryKey: ["files", agendaId],
        queryFn: () => getFiles(agendaId),
    });
    const paths = files.map((file) => file.storage_path);
    const { data: urls = {} } = useQuery({
        queryKey: ["fileUrls", paths],
        queryFn: () => getFileUrls(paths),
        enabled: paths.length > 0,
        staleTime: 50 * 60 * 1000, // 주소 유효시간(1시간)보다 짧게
    });

    const chosen = files.find((file) => file.id === chosenId) ?? files[0] ?? null;
    const chosenUrl = chosen ? urls[chosen.storage_path] : null;

    async function addNewfile(e) {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) {
            alert("PDF와 이미지 파일만 올릴 수 있어요.");
            return;
        }
        if (file.size > MAX_SIZE) {
            alert("20MB 이하 파일만 올릴 수 있어요.");
            return;
        }
        setUploading(true);
        try {
            await uploadFile(roomId, agendaId, file);
            queryClient.invalidateQueries({ queryKey: ["files", agendaId] });
        } catch (error) {
            alert(errorMessage(error));
        } finally {
            setUploading(false);
        }
    }

    async function DeleteFile(file) {
        try {
            await deleteFile(file);
            if (chosenId === file.id) setChosenId(null);
            queryClient.invalidateQueries({ queryKey: ["files", agendaId] });
        } catch (error) {
            alert(errorMessage(error));
        }
    }

    const fileInput = (id) => (
        <input style={{ display: "none" }} id={id} type="file" accept={ALLOWED_TYPES.join(",")} onChange={addNewfile} />
    );

    return (
        <div className={style.Maindiv}>
            <div className={style.Maintitle}>
                <h3>파일</h3>
                <h2 onClick={() => onChange("basic")} >+</h2>
            </div>
            {files.length === 0 ? <>
                {fileInput("Newfile-empty")}
                <div className={style.Nofile}>
                    <label htmlFor="Newfile-empty">
                        <div className={style.Nofilediv} onMouseEnter={() => setIconFile(true)} onMouseLeave={() => setIconFile(false)}>
                            <img alt="Fileicon" src={iconFile ? fileCenterHoverafter : fileCenterHoverbefore} />
                            <h3>{uploading ? "업로드 중..." : "여기 눌러서 파일 업로드하세요"}</h3>
                        </div>
                    </label>
                </div>
            </> : <>
                <div className={style.Viewer}>
                    {chosenUrl && (chosen.is_pdf
                        ? <iframe title="pdf" src={chosenUrl} width="100%" height="100%" />
                        : <img alt={chosen.file_name} src={chosenUrl} />)}
                </div></>}
            {listModal && <div className={style.Filelist} onMouseLeave={() => setListModal(false)}>
                {fileInput("Newfile-list")}
                <label htmlFor="Newfile-list">
                    <div className={style.Createbox}>{uploading ? "…" : "+"}</div>
                </label>
                {files.map((file) => (
                    <div
                        key={file.id}
                        className={style.box}
                        title={file.file_name}
                        onMouseEnter={() => setX(file.id)}
                        onMouseLeave={() => setX(null)}
                        onClick={() => setChosenId(file.id)}>
                        <img alt={file.file_name} src={file.is_pdf ? pdfIcon : urls[file.storage_path]} />
                        {x === file.id && (isHost || file.uploaded_by === userId) && <div className={style.Close} onClick={(e) => {
                            e.stopPropagation();
                            DeleteFile(file);
                        }}
                        //x버튼
                        ><h1>+</h1></div>}
                    </div>
                ))}
            </div>}

            <div className={style.Iconbox}><img alt="listicon" className={style.ListIcon} src={fileIcon} onMouseEnter={() => setListModal(true)} /></div>
        </div >
    );
}
export default File;
