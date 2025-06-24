import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';

const BotSettingPage: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 탭 네비게이션 */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="flex border-b border-gray-200">
              <Link
                to="/workspace"
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                워크스페이스 선택
              </Link>
              <Link
                to="/bot-setting"
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Slack 봇 설정
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900">Slack 봇 설정</h1>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-blue-900 mb-4">봇 설정 방법</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Slack 워크스페이스 관리자 권한 확인</h3>
                    <p className="text-gray-700">봇을 추가하기 위해서는 워크스페이스 관리자 권한이 필요합니다.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">2. Slack App 생성하기</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">1) <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Slack API 페이지</a>에서 "Create New App" 클릭</p>
                      <p className="text-gray-700">2) "From scratch" 선택</p>
                      <p className="text-gray-700">3) App 이름 입력 및 워크스페이스 선택</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Basic Information 설정</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">1) Display Information 섹션 설정:</p>
                      <div className="ml-4 space-y-1">
                        <p className="text-gray-700">• App Name 설정: 예시 - "[UpstageAILab] 운영관리"</p>
                        <p className="text-gray-700">• Short Description: "출결 및 공지사항 알림 봇"</p>
                        <p className="text-gray-700">• App Icon: 과정별 로고 이미지 설정</p>
                        <p className="text-gray-700">• Background Color: 취향별로 설정</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Bot 설정</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">1) App Display Name 섹션에서 Edit 클릭:</p>
                      <div className="ml-4 space-y-1">
                        <p className="text-gray-700">• Display Name (Bot Name): "AI-Notice-Bot"</p>
                        <p className="text-gray-700">• Default username: "@ai_notice"</p>
                      </div>
                      <p className="text-gray-700">2) Short Description: "출결 및 공지사항 알림 봇"</p>
                      <p className="text-gray-700">3) Background Color: #2eb67d</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">5. 봇 권한 설정</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">1) 좌측 메뉴에서 "OAuth & Permissions" 선택</p>
                      <p className="text-gray-700">2) "Bot Token Scopes"에서 다음 권한들을 추가:</p>
                      <div className="ml-4 space-y-1">
                        <p className="text-gray-700">• chat:write</p>
                        <p className="text-gray-700">• chat:write.public</p>
                        <p className="text-gray-700">• incoming-webhook</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">6. 워크스페이스에 봇 설치</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">1) "Install to Workspace" 버튼 클릭</p>
                      <p className="text-gray-700">2) 권한 승인</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">7. Webhook URL 설정</h3>
                    <div className="space-y-2">
                      <p className="text-gray-700">1) 좌측 메뉴에서 "Incoming Webhooks" 선택</p>
                      <p className="text-gray-700">2) "Add New Webhook to Workspace" 클릭</p>
                      <p className="text-gray-700">3) 메시지를 보낼 채널 선택 (3개의 채널 필요)</p>
                      <p className="text-gray-700">4) 각 채널별로 생성된 Webhook URL 복사</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">⚠️ 주의사항</h3>
                <ul className="space-y-2 text-yellow-800">
                  <li>• Webhook URL은 외부에 노출되지 않도록 주의해주세요.</li>
                  <li>• 각 채널별로 별도의 Webhook URL이 필요합니다.</li>
                  <li>• QR 이미지는 HRD-Net 출결 체크용 QR 코드여야 합니다.</li>
                  <li>• 봇 설정에 문제가 있을 경우 관리자에게 문의해주세요.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BotSettingPage; 