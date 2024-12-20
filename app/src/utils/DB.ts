import { ScriptPlayer } from "zep-script";

export default class Database {
    constructor(player: ScriptPlayer) {
        try {
            ScriptApp.httpGet(`http://localhost:3000/api/get-data/${player.id}`, {}, (response: string) => {
                try {
                    if (!response || response.trim() === '') {
                        ScriptApp.sayToStaffs('[Error] 서버 응답이 비어있습니다');
                        this.initializeNewPlayer(player);
                        return;
                    }

                    let result;
                    try {
                        result = JSON.parse(response);
                    } catch (parseError: any) {
                        ScriptApp.sayToStaffs(`[Error] JSON 파싱 실패: ${parseError.message}`);
                        ScriptApp.sayToStaffs(`[Error] 원본 응답: ${response.substring(0, 100)}...`);
                        this.initializeNewPlayer(player);
                        return;
                    }

                    if (result.data) {
                        ScriptApp.sayToStaffs(`[Success] 데이터베이스 초기화 완료: ${player.name} (ID: ${player.id})`);
                        this.handleGameData(result.data);
                    } else {
                        ScriptApp.sayToStaffs(`[Warning] 데이터베이스 초기화 실패: ${result.message || '데이터가 없습니다'}`);
                        this.initializeNewPlayer(player);
                    }
                } catch (error: any) {
                    ScriptApp.sayToStaffs(`[Error] 응답 처리 오류: ${error.message}`);
                    this.initializeNewPlayer(player);
                }
            });
        } catch (error: any) {
            ScriptApp.sayToStaffs(`[Error] HTTP 요청 오류: ${error.message}`);
            this.initializeNewPlayer(player);
        }
    }

    private handleGameData(data: any) {
        try {
            ScriptApp.sayToStaffs('[Info] 기존 플레이어 데이터 로드됨');
            // 데이터 처리 로직
        } catch (error: any) {
            ScriptApp.sayToStaffs(`[Error] 데이터 처리 오류: ${error.message}`);
        }
    }

    private initializeNewPlayer(player: ScriptPlayer) {
        try {
            ScriptApp.sayToStaffs('[Info] 새 플레이어 데이터 초기화됨');
            // 초기화 로직
        } catch (error: any) {
            ScriptApp.sayToStaffs(`[Error] 초기화 오류: ${error.message}`);
        }
    }
}