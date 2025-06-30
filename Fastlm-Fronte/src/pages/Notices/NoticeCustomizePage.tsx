import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { templateCategoryAPI, noticeTemplateAPI } from '../../services/api';
import { NoticeCategory, NoticeTemplate, TemplateVariable, WORKSPACE_VARIABLES } from '../../types';

const NoticeCustomizePage: React.FC = () => {
  const { selectedWorkspace } = useWorkspace();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<NoticeCategory[]>([]);
  const [templates, setTemplates] = useState<NoticeTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<NoticeTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 템플릿 편집 상태
  const [templateData, setTemplateData] = useState({
    name: '',
    title: '',
    content: '',
    variables: [] as TemplateVariable[]
  });
  
  // 변수 값들 (미리보기용)
  const [variableValues, setVariableValues] = useState<Record<string, any>>({});
  
  // 미리보기 상태
  const [previewContent, setPreviewContent] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

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
    // 실시간 미리보기 업데이트
    updatePreview();
  }, [templateData.title, templateData.content, variableValues]);

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
    } catch (error) {
      toast.error('템플릿을 불러오는데 실패했습니다');
    }
  };

  const updatePreview = () => {
    if (!templateData.title && !templateData.content) {
      setPreviewTitle('');
      setPreviewContent('');
      return;
    }

    let title = templateData.title;
    let content = templateData.content;

    // 워크스페이스 변수들로 치환
    if (selectedWorkspace) {
      const currentDate = new Date();
      
      const workspaceVariableValues = {
        name: selectedWorkspace.name,
        checkin_time: selectedWorkspace.checkinTime || '09:00',
        middle_time: selectedWorkspace.middleTime || '13:00',
        checkout_time: selectedWorkspace.checkoutTime || '18:00',
        zoom_url: selectedWorkspace.zoomUrl || '',
        zoom_id: selectedWorkspace.zoomId || '',
        zoom_password: selectedWorkspace.zoomPassword || '',
        current_date: currentDate.toISOString().split('T')[0],
        current_date_kr: `${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`,
        current_time: currentDate.toTimeString().split(' ')[0].substring(0, 5),
        checkin_time_minus_10: selectedWorkspace.checkinTime ? 
          subtractMinutes(selectedWorkspace.checkinTime, 10) : '08:50',
        checkout_time_plus_10: selectedWorkspace.checkoutTime ? 
          addMinutes(selectedWorkspace.checkoutTime, 10) : '18:10'
      };

      // 모든 변수들로 치환
      const allVariables = { ...workspaceVariableValues, ...variableValues };
      
      Object.entries(allVariables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        const replacement = value?.toString() || '';
        title = title.replace(regex, replacement);
        content = content.replace(regex, replacement);
      });
    }

    setPreviewTitle(title);
    setPreviewContent(content);
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

  const handleSelectTemplate = (template: NoticeTemplate) => {
    setSelectedTemplate(template);
    setTemplateData({
      name: template.name,
      title: template.title,
      content: template.content,
      variables: template.variables
    });
    
    // 기본값으로 변수값 초기화
    const initialValues: Record<string, any> = {};
    template.variables.forEach(variable => {
      initialValues[variable.key] = variable.example || '';
    });
    setVariableValues(initialValues);
    
    setIsEditing(true);
  };

  const handleCreateNewTemplate = () => {
    setSelectedTemplate(null);
    setTemplateData({
      name: '',
      title: '',
      content: '',
      variables: []
    });
    setVariableValues({});
    setIsEditing(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedCategory) {
      toast.error('카테고리를 선택해주세요');
      return;
    }

    if (!templateData.name.trim()) {
      toast.error('템플릿 이름을 입력해주세요');
      return;
    }

    try {
      setLoading(true);
      
      if (selectedTemplate) {
        // 업데이트
        await noticeTemplateAPI.updateTemplate(selectedTemplate.id, {
          name: templateData.name,
          title: templateData.title,
          content: templateData.content,
          variables: templateData.variables
        });
        toast.success('템플릿이 업데이트되었습니다');
      } else {
        // 생성
        await noticeTemplateAPI.createTemplate({
          categoryId: selectedCategory,
          name: templateData.name,
          title: templateData.title,
          content: templateData.content,
          workspaceId: selectedWorkspace!.id.toString(),
          variables: templateData.variables
        });
        toast.success('템플릿이 생성되었습니다');
      }
      
      await loadTemplates();
      setIsEditing(false);
    } catch (error) {
      toast.error('템플릿 저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('정말로 이 템플릿을 삭제하시겠습니까?')) return;

    try {
      await noticeTemplateAPI.deleteTemplate(templateId);
      toast.success('템플릿이 삭제되었습니다');
      await loadTemplates();
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setIsEditing(false);
      }
    } catch (error) {
      toast.error('템플릿 삭제에 실패했습니다');
    }
  };

  const addCustomVariable = () => {
    const newVariable: TemplateVariable = {
      key: '',
      label: '',
      description: '',
      example: '',
      required: false,
      type: 'string'
    };
    
    setTemplateData(prev => ({
      ...prev,
      variables: [...prev.variables, newVariable]
    }));
  };

  const updateCustomVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    setTemplateData(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  };

  const removeCustomVariable = (index: number) => {
    setTemplateData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const insertVariable = (variableKey: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + `{${variableKey}}` + after;
      
      setTemplateData(prev => ({ ...prev, content: newText }));
      
      // 커서 위치 조정
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variableKey.length + 2, start + variableKey.length + 2);
      }, 0);
    }
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

  if (!selectedWorkspace) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white shadow rounded-lg p-6">
              <p className="text-gray-500">워크스페이스를 먼저 선택해주세요.</p>
              <Link to="/workspace" className="text-blue-600 hover:text-blue-500 mt-2 inline-block">
                워크스페이스 선택하기
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 탭 네비게이션 */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <Link to="/notices/attendance" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 예약</Link>
              <Link to="/notices/customize" className="px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 whitespace-nowrap">공지 커스터마이징</Link>
              <Link to="/notices/manage" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 관리</Link>
              <Link to="/notices/calendar" className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 whitespace-nowrap">공지 캘린더</Link>
            </div>
          </div>

          {/* 페이지 헤더 */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">공지 커스터마이징</h1>
              <p className="text-sm text-gray-600 mt-1">
                워크스페이스: {selectedWorkspace?.name} - 공지사항 템플릿을 생성하고 편집할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 사이드바 - 카테고리 및 템플릿 목록 */}
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">카테고리</h2>
                
                {/* 카테고리 선택 */}
                <div className="space-y-2 mb-6">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                {selectedCategory && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-md font-medium text-gray-900">템플릿</h3>
                      <button
                        onClick={handleCreateNewTemplate}
                        className="text-sm text-blue-600 hover:text-blue-500"
                      >
                        + 새 템플릿
                      </button>
                    </div>

                    <div className="space-y-2">
                      {templates.map((template) => (
                        <div key={template.id} className="flex items-center justify-between">
                          <button
                            onClick={() => handleSelectTemplate(template)}
                            className={`flex-1 text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedTemplate?.id === template.id
                                ? 'bg-green-100 text-green-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {template.name}
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 메인 컨텐츠 - 편집기 */}
            {isEditing && (
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                  {/* 편집 영역 */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">템플릿 편집</h2>
                      <div className="space-x-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleSaveTemplate}
                          disabled={loading}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {loading ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>

                    {/* 템플릿 이름 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        템플릿 이름
                      </label>
                      <input
                        type="text"
                        value={templateData.name}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="템플릿 이름을 입력하세요"
                      />
                    </div>

                    {/* 제목 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        공지 제목
                      </label>
                      <input
                        type="text"
                        value={templateData.title}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="공지 제목을 입력하세요"
                      />
                    </div>

                    {/* 내용 */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        공지 내용
                      </label>
                      <textarea
                        id="template-content"
                        value={templateData.content}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={12}
                        placeholder="공지 내용을 입력하세요. Slack 마크다운을 사용할 수 있습니다."
                      />
                    </div>

                    {/* 변수 목록 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          사용 가능한 변수
                        </label>
                        <button
                          onClick={addCustomVariable}
                          className="text-sm text-blue-600 hover:text-blue-500"
                        >
                          + 커스텀 변수 추가
                        </button>
                      </div>
                      
                      {/* 워크스페이스 기본 변수들 */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-2">워크스페이스 변수 (클릭하여 추가)</p>
                        <div className="flex flex-wrap gap-1">
                          {WORKSPACE_VARIABLES.map((variable) => (
                            <button
                              key={variable.key}
                              onClick={() => insertVariable(variable.key)}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                              title={variable.description}
                            >
                              {`{${variable.key}}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 커스텀 변수들 */}
                      {templateData.variables.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">커스텀 변수</p>
                          <div className="space-y-2">
                            {templateData.variables.map((variable, index) => (
                              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                                <input
                                  type="text"
                                  value={variable.key}
                                  onChange={(e) => updateCustomVariable(index, 'key', e.target.value)}
                                  placeholder="변수명"
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                                <input
                                  type="text"
                                  value={variable.label}
                                  onChange={(e) => updateCustomVariable(index, 'label', e.target.value)}
                                  placeholder="라벨"
                                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                                />
                                <button
                                  onClick={() => insertVariable(variable.key)}
                                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                  disabled={!variable.key}
                                >
                                  추가
                                </button>
                                <button
                                  onClick={() => removeCustomVariable(index)}
                                  className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  삭제
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 마크다운 가이드 */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium text-blue-800 mb-2">Slack 마크다운 가이드</p>
                      <div className="text-xs text-blue-700 space-y-1">
                        <p><code>**굵게**</code> → <strong>굵게</strong></p>
                        <p><code>*기울임*</code> → <em>기울임</em></p>
                        <p><code>`코드`</code> → <code>코드</code></p>
                        <p><code>&gt; 인용문</code> → 인용문 블록</p>
                        <p><code>- 목록</code> → 불릿 리스트</p>
                        <p><code>1. 번호 목록</code> → 번호 리스트</p>
                        <p><code>&lt;URL|링크텍스트&gt;</code> → 클릭 가능한 링크 </p>
                        <p><code>https://example.com</code> → 자동 링크 변환</p>
                      </div>
                    </div>
                  </div>

                  {/* 미리보기 영역 */}
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">미리보기</h2>
                    
                    {/* 변수값 입력 */}
                    {templateData.variables.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">변수값 설정</p>
                        <div className="space-y-2">
                          {templateData.variables.map((variable, index) => (
                            variable.key && (
                              <div key={index}>
                                <label className="block text-xs text-gray-600">
                                  {variable.label || variable.key}
                                </label>
                                <input
                                  type="text"
                                  value={variableValues[variable.key] || ''}
                                  onChange={(e) => setVariableValues(prev => ({
                                    ...prev,
                                    [variable.key]: e.target.value
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  placeholder={variable.example || '값을 입력하세요'}
                                />
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 실제 미리보기 */}
                    <div className="border border-gray-200 rounded-md p-4 bg-gray-50 min-h-[400px]">
                      {previewTitle && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-gray-600 mb-1">제목:</p>
                          <div 
                            className="font-semibold text-gray-900"
                            dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(previewTitle) }}
                          />
                        </div>
                      )}
                      
                      {previewContent && (
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-1">내용:</p>
                          <div 
                            className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: renderMarkdownPreview(previewContent) }}
                          />
                        </div>
                      )}
                      
                      {!previewTitle && !previewContent && (
                        <p className="text-gray-500 text-center mt-8">
                          제목이나 내용을 입력하면 여기에 미리보기가 표시됩니다.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 템플릿이 선택되지 않았을 때 */}
            {!isEditing && (
              <div className="lg:col-span-3">
                <div className="bg-white shadow rounded-lg p-6 text-center">
                  <p className="text-gray-500 mb-4">
                    카테고리를 선택하고 템플릿을 편집하거나 새로운 템플릿을 만들어보세요.
                  </p>
                  <p className="text-sm text-gray-400">
                    공지 템플릿을 사용하여 일관된 형식의 공지를 쉽게 작성할 수 있습니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NoticeCustomizePage; 