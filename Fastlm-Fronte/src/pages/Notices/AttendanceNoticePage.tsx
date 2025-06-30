import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { templateCategoryAPI, noticeTemplateAPI, noticeAPI } from '../../services/api';
import { NoticeCategory, NoticeTemplate, WORKSPACE_VARIABLES } from '../../types';

const AttendanceNoticePage: React.FC = () => {
  const { selectedWorkspace } = useWorkspace();
  
  const [categories, setCategories] = useState<NoticeCategory[]>([]);
  const [templates, setTemplates] = useState<NoticeTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<NoticeTemplate | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const [includeQRImage, setIncludeQRImage] = useState(true); // QR 이미지 첨부 옵션

  // 달력 상태
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  // 미리보기 상태
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [selectedWebhook, setSelectedWebhook] = useState(''); // 선택된 웹훅

  useEffect(() => {
    if (selectedWorkspace) {
      loadCategories();
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    if (selectedCategory) {
      loadTemplates();
    }
  }, [selectedCategory]);

  useEffect(() => {
    updatePreview();
  }, [selectedTemplate, variableValues, selectedDates]);

  const loadCategories = async () => {
    try {
      const data = await templateCategoryAPI.getCategories(selectedWorkspace?.id.toString());
      setCategories(data);
    } catch (error) {
      toast.error('카테고리를 불러오는데 실패했습니다');
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await noticeTemplateAPI.getTemplates(
        selectedWorkspace?.id.toString(), 
        selectedCategory
      );
      setTemplates(data);
      setSelectedTemplate(null);
      setVariableValues({});
    } catch (error) {
      toast.error('템플릿을 불러오는데 실패했습니다');
    }
  };

  const updatePreview = () => {
    if (!selectedTemplate) {
      setPreviewTitle('');
      setPreviewContent('');
      return;
    }

    let previewTitleText = selectedTemplate.title;
    let previewContentText = selectedTemplate.content;

    // 워크스페이스 변수들로 치환
    if (selectedWorkspace) {
      // 선택된 날짜가 있으면 첫 번째 날짜 사용, 없으면 오늘 날짜 사용
      const targetDate = selectedDates.length > 0 ? new Date(selectedDates[0] + 'T00:00:00') : new Date();
      
      const workspaceVariableValues = {
        name: selectedWorkspace.name,
        checkin_time: selectedWorkspace.checkinTime || '09:00',
        middle_time: selectedWorkspace.middleTime || '13:00',
        checkout_time: selectedWorkspace.checkoutTime || '18:00',
        zoom_url: selectedWorkspace.zoomUrl || '',
        zoom_id: selectedWorkspace.zoomId || '',
        zoom_password: selectedWorkspace.zoomPassword || '',
        current_date: targetDate.toISOString().split('T')[0],
        current_date_kr: `${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일`,
        current_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        checkin_time_minus_10: selectedWorkspace.checkinTime ? 
          subtractMinutes(selectedWorkspace.checkinTime, 10) : '08:50',
        checkout_time_plus_10: selectedWorkspace.checkoutTime ? 
          addMinutes(selectedWorkspace.checkoutTime, 10) : '18:10'
      };

      // 모든 변수들로 치환 (워크스페이스 변수 + 커스텀 변수)
      const allVariables = { ...workspaceVariableValues, ...variableValues };
      
      console.log('치환할 변수들:', allVariables); // 디버그용
      
      Object.entries(allVariables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        const replacement = value?.toString() || '';
        previewTitleText = previewTitleText.replace(regex, replacement);
        previewContentText = previewContentText.replace(regex, replacement);
      });
      
      console.log('치환 후 제목:', previewTitleText); // 디버그용
      console.log('치환 후 내용:', previewContentText); // 디버그용
    }

    setPreviewTitle(previewTitleText);
    setPreviewContent(previewContentText);
  };

  const renderMarkdownPreview = (content: string) => {
    // 기본적인 Slack 마크다운 렌더링
    let rendered = content;
    
    // 먼저 Slack 스타일 링크 처리: <URL|텍스트> 형식
    rendered = rendered.replace(/<(https?:\/\/[^\s|>]+)\|([^>]+)>/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: underline;">$2</a>');
    
    // URL 자동 링크화 (이미 링크 태그 안에 있는 것은 제외)
    rendered = rendered.replace(/(?<!href=["'])(?<!>)(https?:\/\/[^\s<>]+)(?![^<]*<\/a>)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #1d4ed8; text-decoration: underline;">$1</a>');
    
    // 순서가 중요함 - 더 구체적인 패턴부터 처리
    rendered = rendered.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // **굵게**
    rendered = rendered.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>'); // *기울임* (단, **는 제외)
    rendered = rendered.replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.875em;">$1</code>'); // `코드`
    
    // 블록 요소들
    rendered = rendered.replace(/^> (.+)$/gm, '<div style="border-left: 4px solid #d1d5db; margin: 8px 0; padding-left: 16px; color: #6b7280; font-style: italic;">$1</div>'); // > 인용문
    
    // 리스트 - 줄바꿈을 고려하여 처리
    const lines = rendered.split('\n');
    let inList = false;
    let listItems: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const unorderedMatch = line.match(/^[\s]*-\s+(.+)$/);
      const orderedMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
      
      if (unorderedMatch || orderedMatch) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        const content = unorderedMatch ? unorderedMatch[1] : orderedMatch![1];
        listItems.push(`<li style="margin: 4px 0;">${content}</li>`);
      } else {
        if (inList) {
          // 리스트 종료
          const listHtml = `<ul style="margin: 8px 0; padding-left: 20px; list-style-type: disc;">${listItems.join('')}</ul>`;
          lines[i - listItems.length] = listHtml;
          // 기존 리스트 아이템들 제거
          for (let j = 1; j < listItems.length; j++) {
            lines[i - listItems.length + j] = '';
          }
          inList = false;
          listItems = [];
        }
      }
    }
    
    // 마지막에 리스트가 끝나지 않은 경우 처리
    if (inList) {
      const listHtml = `<ul style="margin: 8px 0; padding-left: 20px; list-style-type: disc;">${listItems.join('')}</ul>`;
      lines[lines.length - listItems.length] = listHtml;
      for (let j = 1; j < listItems.length; j++) {
        lines[lines.length - listItems.length + j] = '';
      }
    }
    
    rendered = lines.filter(line => line !== '').join('\n');
    
    // 줄바꿈 처리
    rendered = rendered.replace(/\n/g, '<br>');
    
    return rendered;
  };

  const subtractMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins - minutes);
    return date.toTimeString().split(' ')[0].substring(0, 5);
  };

  const addMinutes = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    return date.toTimeString().split(' ')[0].substring(0, 5);
  };

  const handleTemplateSelect = (template: NoticeTemplate) => {
    setSelectedTemplate(template);
    
    // 변수 기본값 설정
    const initialValues: Record<string, any> = {};
    template.variables.forEach(variable => {
      initialValues[variable.key] = variable.example || '';
    });
    setVariableValues(initialValues);
  };

  const handleDateToggle = (date: string) => {
    setSelectedDates(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      } else {
        return [...prev, date].sort();
      }
    });
  };

  // 달력 생성 함수
  const generateCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days = [];
    
    // 이전 달의 빈 칸들
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateString = date.toISOString().split('T')[0];
      days.push({
        day,
        dateString,
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: selectedDates.includes(dateString)
      });
    }
    
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorkspace) {
      toast.error('워크스페이스를 선택해주세요');
      return;
    }

    if (!selectedTemplate) {
      toast.error('템플릿을 선택해주세요');
      return;
    }

    if (selectedDates.length === 0) {
      toast.error('예약 날짜를 선택해주세요');
      return;
    }

    // 필수 변수 체크 (커스텀 변수 기능은 주석 처리)
    // const missingRequiredVars = selectedTemplate.variables
    //   .filter(variable => variable.required && !variableValues[variable.key]?.trim())
    //   .map(variable => variable.label || variable.key);

    // if (missingRequiredVars.length > 0) {
    //   toast.error(`다음 필수 변수를 입력해주세요: ${missingRequiredVars.join(', ')}`);
    //   return;
    // }

    try {
      setLoading(true);

      // 선택된 모든 날짜에 대해 공지 예약
      const promises = selectedDates.map(date => {
        const scheduledDateTime = `${date}T${scheduledTime}:00`;
        const scheduledAt = new Date(scheduledDateTime).toISOString();

        return noticeAPI.createNotice({
          type: 'custom',
          categoryId: parseInt(selectedCategory),
          templateId: selectedTemplate.id,
          title: previewTitle,
          message: previewContent,
          workspaceId: selectedWorkspace.id,
          scheduledAt: scheduledDateTime,
          status: 'scheduled',
          createdBy: 'current-user', // TODO: 실제 사용자 ID로 교체
          noImage: !includeQRImage, // QR 이미지 첨부 여부
          variableData: variableValues,
          selectedWebhookUrl: getSelectedWebhookUrl() // 선택된 웹훅 URL 전달
        });
      });

      await Promise.all(promises);

      toast.success(`${selectedDates.length}개 날짜에 공지가 예약되었습니다`);
      
      // 폼 초기화
      setSelectedTemplate(null);
      setVariableValues({});
      setSelectedDates([]);
      
    } catch (error) {
      toast.error('공지 예약에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getAvailableWebhooks = () => {
    if (!selectedWorkspace) return [];
    
    const webhooks: { name: string; url: string }[] = [];
    
    // 기본 슬랙 웹훅
    if (selectedWorkspace.slackWebhookUrl) {
      const slackWebhookName = (selectedWorkspace as any).slackWebhookName || '기본 슬랙';
      webhooks.push({ name: slackWebhookName, url: selectedWorkspace.slackWebhookUrl });
    }
    
    // 추가 웹훅들
    if (selectedWorkspace.webhookUrls && selectedWorkspace.webhookUrls.length > 0) {
      selectedWorkspace.webhookUrls.forEach((webhook: any) => {
        if (typeof webhook === 'object' && webhook.name && webhook.url) {
          webhooks.push(webhook);
        } else if (typeof webhook === 'string' && webhook.trim()) {
          webhooks.push({ name: `웹훅 ${webhooks.length + 1}`, url: webhook });
        }
      });
    }
    
    return webhooks;
  };

  const getSelectedWebhookUrl = () => {
    const webhooks = getAvailableWebhooks();
    const selected = webhooks.find(w => w.name === selectedWebhook);
    return selected?.url || selectedWorkspace?.slackWebhookUrl || '';
  };

  if (!selectedWorkspace) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">워크스페이스를 선택해주세요</h2>
              <Link 
                to="/workspace" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                워크스페이스 선택하기
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const calendarDays = generateCalendar(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth());
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 탭 네비게이션 */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <Link
                to="/notices/attendance"
                className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              >
                공지 예약
              </Link>
              <Link
                to="/notices/customize"
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              >
                공지 커스터마이징
              </Link>
              <Link
                to="/notices/manage"
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              >
                공지 관리
              </Link>
              <Link
                to="/notices/calendar"
                className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap"
              >
                공지 캘린더
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">공지 예약</h1>
              <p className="text-sm text-gray-600 mt-1">
                워크스페이스: {selectedWorkspace?.name} - 출결 공지, 만족도 조사, 운영 질문 스레드 등 다양한 공지사항을 예약할 수 있습니다.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 왼쪽: 템플릿 선택 및 설정 */}
                <div className="space-y-6">
                  {/* 카테고리 선택 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">카테고리 선택</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedCategory === category.id
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium">{category.name}</div>
                          {category.description && (
                            <div className="text-sm text-gray-500 mt-1">{category.description}</div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 템플릿 선택 */}
                  {selectedCategory && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">템플릿 선택</h3>
                      <div className="space-y-3">
                        {templates.map(template => (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                              selectedTemplate?.id === template.id
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-gray-500 mt-1 truncate">{template.title}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 예약 설정 */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">예약 설정</h3>
                    
                    {/* 시간 설정 */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        예약 시간
                      </label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* 달력으로 날짜 선택 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        예약 날짜 (다중 선택 가능)
                      </label>
                      
                      {/* 달력 헤더 */}
                      <div className="bg-gray-50 rounded-t-lg border border-b-0 border-gray-300 p-4">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-600"
                          >
                            ←
                          </button>
                          <h4 className="text-lg font-semibold text-gray-800">
                            {currentCalendarDate.getFullYear()}년 {monthNames[currentCalendarDate.getMonth()]}
                          </h4>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 text-gray-600"
                          >
                            →
                          </button>
                        </div>
                      </div>

                      {/* 요일 헤더 */}
                      <div className="grid grid-cols-7 border-l border-r border-gray-300">
                        {dayNames.map((day, index) => (
                          <div
                            key={day}
                            className={`p-3 text-center text-sm font-medium border-b border-gray-300 ${
                              index === 0 ? 'text-red-600 bg-red-50' : 'text-gray-700 bg-gray-50'
                            }`}
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* 달력 그리드 */}
                      <div className="grid grid-cols-7 border-l border-r border-b border-gray-300 rounded-b-lg overflow-hidden">
                        {calendarDays.map((day, index) => (
                          <div
                            key={index}
                            className="aspect-square border-r border-b border-gray-200 last:border-r-0"
                          >
                            {day && (
                              <button
                                type="button"
                                onClick={() => handleDateToggle(day.dateString)}
                                className={`w-full h-full p-1 text-sm transition-all ${
                                  day.isSelected
                                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                                    : day.isToday
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <div className="w-full h-full flex items-center justify-center rounded">
                                  {day.day}
                                </div>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {selectedDates.length > 0 && (
                        <p className="text-sm text-blue-600 mt-2">
                          {selectedDates.length}개 날짜 선택됨: {selectedDates.map(date => {
                            const d = new Date(date + 'T00:00:00');
                            return `${d.getMonth() + 1}/${d.getDate()}`;
                          }).join(', ')}
                        </p>
                      )}
                    </div>

                    {/* QR 이미지 첨부 옵션 */}
                    <div className="mt-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="includeQRImage"
                          checked={includeQRImage}
                          onChange={(e) => setIncludeQRImage(e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="includeQRImage" className="ml-2 text-sm font-medium text-gray-700">
                          QR 이미지 첨부
                        </label>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        체크하면 워크스페이스의 QR 이미지가 공지와 함께 전송됩니다
                      </p>
                    </div>

                    {/* 웹훅 선택 */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        발송할 웹훅 선택 *
                      </label>
                      <select
                        value={selectedWebhook}
                        onChange={(e) => setSelectedWebhook(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">웹훅을 선택하세요</option>
                        {getAvailableWebhooks().map((webhook, index) => (
                          <option key={index} value={webhook.name}>
                            {webhook.name}
                          </option>
                        ))}
                      </select>
                      {getAvailableWebhooks().length === 0 && (
                        <p className="mt-1 text-sm text-red-600">
                          등록된 웹훅이 없습니다. 워크스페이스 설정에서 웹훅을 등록해주세요.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 제출 버튼 */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !selectedTemplate || selectedDates.length === 0}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? '예약 중...' : `${selectedDates.length}개 날짜에 공지 예약`}
                  </button>
                </div>

                {/* 오른쪽: 미리보기 */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">미리보기</h3>
                  
                  {selectedTemplate ? (
                    <div className="space-y-4">
                      {/* 제목 미리보기 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                        <div className="p-3 bg-white rounded-md border">
                          <div 
                            className="text-gray-800 font-medium"
                            dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(previewTitle) }}
                          />
                        </div>
                      </div>

                      {/* 내용 미리보기 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                        <div className="p-4 bg-white rounded-md border min-h-[300px]">
                          <div 
                            className="text-gray-800 whitespace-pre-wrap leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(previewContent) }}
                          />
                        </div>
                      </div>

                      {/* 변수 정보 */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">사용 가능한 변수</label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {WORKSPACE_VARIABLES.map(variable => (
                            <div 
                              key={variable.key}
                              className="p-2 bg-blue-50 rounded text-blue-700 font-mono"
                            >
                              {'{' + variable.key + '}'}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* QR 이미지 미리보기 */}
                      {includeQRImage && selectedWorkspace?.qrImageUrl && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">첨부될 QR 이미지</label>
                          <div className="p-3 bg-white rounded-md border">
                            <img 
                              src={selectedWorkspace.qrImageUrl} 
                              alt="워크스페이스 QR 코드"
                              className="w-32 h-32 object-contain mx-auto"
                            />
                            <p className="text-xs text-gray-500 text-center mt-2">
                              이 QR 이미지가 공지와 함께 전송됩니다
                            </p>
                          </div>
                        </div>
                      )}

                      {includeQRImage && !selectedWorkspace?.qrImageUrl && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">QR 이미지</label>
                          <div className="p-3 bg-yellow-50 rounded-md border border-yellow-200">
                            <p className="text-xs text-yellow-700 text-center">
                              워크스페이스에 QR 이미지가 설정되지 않았습니다
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <p>템플릿을 선택하면 미리보기가 표시됩니다</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AttendanceNoticePage;
