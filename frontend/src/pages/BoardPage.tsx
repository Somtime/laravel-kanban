import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { boardsApi } from '@/api/boards';
import { teamsApi } from '@/api/teams';
import { useAuth } from '@/contexts/AuthContext';
import type { Team, Board, ColumnResponse, Task } from '@/api/types';

export function BoardPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<ColumnResponse[]>([]);

  // 권한 제어 연산
  const members = team?.users || [];
  const myRole = members.find(m => m.id === user?.id)?.pivot?.role;
  const isOwner = myRole === 'owner';
  const isManager = myRole === 'manager';
  const canManageBoard = isOwner || isManager;

  // 새 태스크 생성 관련 상태
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [targetColumnId, setTargetColumnId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // 태스크 상세조회 및 수정 모달 관련 상태
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task & { columnId?: number } | null>(null);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  // 내 태스크 모아보기 필터
  const [filterMyTasks, setFilterMyTasks] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!teamId) return;
      try {
        const teamData = await teamsApi.getTeam(Number(teamId));
        setTeam(teamData);
        
        // BE 연동: 해당 팀의 보드 목록을 가져와 첫 번째 보드를 표시 (없으면 임시 생성 요청) 
        // 실제로는 여러 보드를 지원할 수 있으나 여기선 1팀당 기본 1보드로 가정
        const boardsData = await boardsApi.getBoards(Number(teamId));
        let activeBoard = boardsData[0];
        
        if (!activeBoard) {
            // 이 팀에 보드가 없다면 빈 보드 하나 생성
            activeBoard = await boardsApi.createBoard(Number(teamId), '기본 보드');
            // 빈 보드일테니 기본 컬럼도 생성
            await boardsApi.createColumn(activeBoard.id, 'To Do');
            await boardsApi.createColumn(activeBoard.id, 'In Progress');
            await boardsApi.createColumn(activeBoard.id, 'Done');
        }

        // 보드 상세 정보(컬럼과 태스크 중첩) 가져오기
        const boardDetail = await boardsApi.getBoard(activeBoard.id);
        setBoard(boardDetail);
        
        // order 기준으로 컬럼 정렬 (DB에서 정렬되어 온다고 해도 클라에서 한 번 더 보장)
        const sortedCols = (boardDetail.columns || []).sort((a, b) => a.order - b.order);
        // 컬럼 안의 태스크들도 order 기준으로 정렬
        sortedCols.forEach(col => {
           if (col.tasks) {
               col.tasks.sort((a, b) => a.order - b.order);
           } else {
               col.tasks = [];
           }
        });
        setColumns(sortedCols);
        
      } catch (error) {
        console.error('Failed to load board data:', error);
        navigate('/teams', { replace: true });
      }
    };
    loadData();
  }, [teamId, navigate]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // source와 destination 컬럼 인덱스
    const sourceColIndex = columns.findIndex(col => col.id.toString() === source.droppableId);
    const destColIndex = columns.findIndex(col => col.id.toString() === destination.droppableId);

    const sourceCol = columns[sourceColIndex];
    const destCol = columns[destColIndex];

    const sourceTasks = [...sourceCol.tasks];
    const destTasks = source.droppableId === destination.droppableId ? sourceTasks : [...destCol.tasks];

    // 기존 배열에서 제거
    const [removed] = sourceTasks.splice(source.index, 1);
    
    // 새 배열, 새 위치에 삽입
    destTasks.splice(destination.index, 0, removed);

    // 낙관적 UI 업데이트
    const newColumns = [...columns];
    newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks };
    
    if (source.droppableId !== destination.droppableId) {
      newColumns[destColIndex] = { ...destCol, tasks: destTasks };
    }

    setColumns(newColumns);
    
    // BE 저장 통신
    // BE API `PUT /api/tasks/{task}/move` 의 `order`는 0-indexed 혹은 1-indexed에 맞춰 전달 (여기선 낙관적 index + 1을 기준으로 전송한다고 가정)
    try {
        await boardsApi.moveTask(Number(draggableId), destCol.id, destination.index + 1);
    } catch (e) {
        console.error('Task move API failed', e);
        // TODO: 실패 시 롤백 UI 처리 필요 가능성
    }
  };

  const openNewTaskDialog = (colId: number) => {
    setTargetColumnId(colId);
    setNewTaskTitle('');
    setNewTaskDesc('');
    setIsTaskOpen(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetColumnId || !newTaskTitle.trim()) return;

    setIsCreatingTask(true);
    try {
      const createdTask = await boardsApi.createTask(targetColumnId, newTaskTitle, newTaskDesc);
      
      // 로컬 UI 즉시 반영 (새 태스크를 맨 아래(또는 맨 위)에 추가)
      const maxOrder = columns.find(c => c.id === targetColumnId)?.tasks?.length || 0;
      createdTask.order = maxOrder + 1; // 로컬용 표시 order
      
      // 백엔드에서 생성 직후 관계 모델(creator, assignee)을 완전하게 로드해 주지 않았을 수 있으므로
      // 프론트엔드에서 현재 유저(생성자) 정보를 붙여줘서 렌더링 뻗는 것을 방지
      if (!createdTask.creator && user) {
        createdTask.creator = { id: user.id, name: user.name, email: user.email };
      }
      if (!createdTask.creator_id && user) {
        createdTask.creator_id = user.id;
      }

      setColumns(prevCols => prevCols.map(col => {
        if (col.id === targetColumnId) {
          return {
            ...col,
            tasks: [...col.tasks, createdTask]
          };
        }
        return col;
      }));

      setIsTaskOpen(false);
    } catch (err) {
      console.error('태스크 생성 실패:', err);
      alert('태스크 생성에 실패했습니다.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  // 담당자 즉시 수정용 함수(handleAssignTask)는 모달 내부 저장 버튼으로 통합되어 제거됨

  const openTaskDetail = (task: Task, columnId: number) => {
    setSelectedTask({ ...task, columnId });
    setIsTaskDetailOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !selectedTask.title.trim() || !selectedTask.columnId) return;

    setIsUpdatingTask(true);
    try {
      const updatedInfo = {
        title: selectedTask.title,
        description: selectedTask.description,
        // 드롭다운 변경사항 합산
        assignee_id: selectedTask.assignee_id
      };
      
      const resTask = await boardsApi.updateTask(selectedTask.id, updatedInfo);
      
      const newAssignee = team?.users?.find(u => u.id === selectedTask.assignee_id);
      
      // 로컬 화면 갱신: 모달용 selectedTask를 실제 columns 배열에서 찾아 덮어쓰기
      setColumns(prevCols => prevCols.map(col => {
        if (col.id === selectedTask.columnId) {
          return {
            ...col,
            tasks: col.tasks.map(t => t.id === selectedTask.id ? { 
              ...t, 
              title: resTask.title, 
              description: resTask.description,
              assignee_id: selectedTask.assignee_id,
              assignee: newAssignee
            } : t)
          };
        }
        return col;
      }));

      setIsTaskDetailOpen(false);
    } catch (err) {
      console.error('태스크 수정 에러:', err);
      alert('태스크 수정에 실패했습니다.');
    } finally {
      setIsUpdatingTask(false);
    }
  };

  if (!team || !board) return <div className="flex h-[calc(100vh-64px)] items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-100/50">
      <header className="flex-shrink-0 bg-white border-b px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{team.name} 보드</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">드래그 앤 드롭으로 카드를 이동하세요.</p>
        </div>
        <div className="flex items-center space-x-4">
           {/* 필터 토글 */}
           <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
             <input 
               type="checkbox" 
               id="filterMyTasks" 
               checked={filterMyTasks} 
               onChange={(e) => setFilterMyTasks(e.target.checked)} 
               className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer" 
             />
             <Label htmlFor="filterMyTasks" className="text-sm font-medium cursor-pointer select-none text-slate-700">내 업무만 보기</Label>
           </div>
           
           <div className="flex space-x-2 border-l pl-4 border-slate-200">
             {canManageBoard && (
               <Button variant="outline" size="sm" onClick={() => alert('새 컬럼 추가 API 연동 보류 (백엔드 맞춰 모달 필요)')}>+ 새 컬럼</Button>
             )}
             <Button variant="secondary" size="sm" onClick={() => navigate('/teams')}>목록으로</Button>
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-8">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex space-x-6 items-start">
            {columns.map((column) => (
              <div key={column.id} className="w-80 flex-shrink-0 bg-slate-200/50 rounded-xl p-4 flex flex-col max-h-full">
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="font-semibold text-slate-700">{column.name}</h3>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{column.tasks.length}</span>
                </div>
                
                <Droppable droppableId={column.id.toString()}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[150px] transition-colors rounded-lg overflow-y-auto ${snapshot.isDraggingOver ? 'bg-slate-200' : ''}`}
                    >
                      <div className="space-y-3">
                        {column.tasks.map((task, index) => {
                          // 태스크의 생성자이거나 담당자이면 본인의 업무로 판정
                          const isMyTask = task.creator_id === user?.id || task.assignee_id === user?.id;
                          
                          // API에서 creator를 주지 않을 경우를 대비해 팀 유저 목록에서 조회
                          const creatorUser = task.creator || team.users?.find(u => u.id === task.creator_id);
                          // API에서 assignee 객체를 중첩해주지 않은 경우를 대비해 id로 팀원 목록에서 찾아서 사용
                          const assigneeUser = task.assignee || team.users?.find(u => u.id === task.assignee_id);

                          // 필터링 적용 중이면서 내 카드가 아닐 경우 투명화/드래그 방지로 포커싱
                          const displayOpacity = (filterMyTasks && !isMyTask) ? "opacity-20 pointer-events-none" : "hover:border-primary/50 cursor-grab active:cursor-grabbing";
                          
                          // Draggable의 id는 항상 고유한 string 값이어야 하므로 확실히 방어
                          const draggableId = task.id ? task.id.toString() : `temp-${index}-${Date.now()}`;
                          
                          return (
                            <Draggable key={draggableId} draggableId={draggableId} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                    <Card 
                                      className={`pt-2 pb-1 shadow-sm bg-white transition-all cursor-pointer group ${displayOpacity} ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/20 rotate-1' : ''}`}
                                      onClick={(e) => {
                                        // 드래그 라이브러리가 이미 드래그로 판정하여 기본 동작을 막았거나, 드래그 상태이면 클릭 무시
                                        if (e.defaultPrevented || snapshot.isDragging) return;
                                        openTaskDetail(task, column.id);
                                      }}
                                    >
                                      <CardContent className="p-3 flex flex-col justify-between h-full">
                                        {/* 카드 본문 (타이틀) */}
                                        <div className="flex-1">
                                          <p className="text-sm font-semibold leading-tight text-slate-800 group-hover:text-primary transition-colors">
                                            {task.title}
                                          </p>
                                        </div>
                                      
                                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100">
                                        
                                        {/* 생성자 표시 영역 (수정 불가, 툴팁 대용 타이틀 추가) */}
                                        <div className="flex items-center px-1" title="생성자">
                                          <span className="text-[10px] text-slate-400 mr-1.5 shrink-0">요청</span>
                                          <div className="flex items-center space-x-1.5">
                                            <Avatar className="h-6 w-6 border-slate-200 bg-slate-50 text-slate-500">
                                              <AvatarFallback className="text-[10px] bg-slate-100 font-medium">
                                                {creatorUser?.name?.substring(0, 1).toUpperCase() || 'C'}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]">
                                              {creatorUser?.name || `ID ${task.creator_id}`}
                                            </span>
                                          </div>
                                        </div>

                                        {/* 담당자 표시 영역 (읽기 전용) */}
                                        <div className="flex items-center px-1" title="담당자">
                                          <span className="text-[10px] text-slate-400 mr-1.5 font-normal shrink-0">담당</span>
                                          <div className="flex items-center space-x-1.5">
                                            <Avatar className="h-6 w-6 border-indigo-100">
                                              <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-700 font-bold">
                                                {assigneeUser?.name?.substring(0, 1).toUpperCase() || '?'}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-[11px] text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]">
                                              {assigneeUser?.name || '할당 안됨'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
                
                {canManageBoard && (
                  <Button 
                    variant="ghost" 
                    className="w-[100%] mt-4 justify-start text-muted-foreground hover:text-slate-900 border-dashed border"
                    onClick={() => openNewTaskDialog(column.id)}
                  >
                    + 태스크 추가
                  </Button>
                )}
              </div>
            ))}
          </div>
        </DragDropContext>
      </main>

      {/* 태스크 추가 모달 */}
      <Dialog open={isTaskOpen} onOpenChange={setIsTaskOpen}>
        <DialogContent>
          <form onSubmit={handleCreateTask}>
            <DialogHeader>
              <DialogTitle>새 태스크 추가</DialogTitle>
              <DialogDescription>
                선택한 컬럼에 들어갈 업무 상세 정보(제목과 설명)를 입력하세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">태스크 제목 <span className="text-red-500">*</span></Label>
                <Input 
                  id="title" 
                  placeholder="예: 로그인 페이지 퍼블리싱" 
                  value={newTaskTitle} 
                  onChange={(e) => setNewTaskTitle(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">상세 설명</Label>
                <Input 
                  id="desc" 
                  placeholder="예: 반응형 대응 및 validation 처리 포함" 
                  value={newTaskDesc} 
                  onChange={(e) => setNewTaskDesc(e.target.value)} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsTaskOpen(false)}>취소</Button>
              <Button type="submit" disabled={isCreatingTask || !newTaskTitle.trim()}>
                {isCreatingTask ? '추가 중...' : '확인'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 태스크 상세 및 수정 모달 */}
      <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleUpdateTask}>
            {/* Radix UI 접근성(Aria) 에러 방지용으로 Title은 남기되 시각적으로 숨김 */}
            <DialogHeader className="sr-only">
              <DialogTitle>태스크 상세조회 및 수정</DialogTitle>
              <DialogDescription>태스크의 담당자, 제목, 설명을 열람하고 변경할 수 있습니다.</DialogDescription>
            </DialogHeader>
            
            {selectedTask && (() => {
              const currentAssignee = selectedTask.assignee || team.users?.find(u => u.id === selectedTask.assignee_id);
              return (
              <div className="space-y-6 py-4">
                <div className="flex items-center space-x-12 bg-slate-50 px-4 py-3 rounded-lg border border-slate-100 mb-2">
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">요청자</span>
                    <div className="flex items-center space-x-2 h-7">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-slate-200 text-slate-600">
                          {selectedTask.creator?.name?.substring(0,1).toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-slate-700">{selectedTask.creator?.name || `ID ${selectedTask.creator_id}`}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">담당자</span>
                    {/* 수정 권한이 있는 경우에만 드롭다운 표출, 그 외엔 읽기 전용 */}
                    {(canManageBoard || selectedTask.creator_id === user?.id || selectedTask.assignee_id === user?.id) ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center space-x-2 hover:bg-slate-200/50 border border-transparent rounded px-2 -ml-2 transition-colors h-7" type="button" title="담당자 지정">
                            <Avatar className="h-6 w-6 border border-indigo-100">
                              <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-700">
                                {currentAssignee?.name?.substring(0,1).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                              {currentAssignee?.name || '담당자 없음'}
                            </span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border-b mb-1">담당자 변경</div>
                          <div className="max-h-48 overflow-y-auto">
                            {team.users?.map(member => (
                              <DropdownMenuItem 
                                key={member.id} 
                                className="text-xs cursor-pointer" 
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (selectedTask.columnId) {
                                      // 모달 화면용 selectedTask도 즉시 동기화
                                      setSelectedTask({
                                        ...selectedTask,
                                        assignee_id: member.id,
                                        assignee: member
                                      });
                                  }
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-700">{member.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{member.email}</span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                          </div>
                          <DropdownMenuItem 
                            className="text-xs text-destructive font-semibold cursor-pointer border-t mt-1 pt-2" 
                            onSelect={(e) => {
                              e.preventDefault();
                              if (selectedTask.columnId) {
                                  setSelectedTask({
                                    ...selectedTask,
                                    assignee_id: null,
                                    assignee: undefined,
                                  });
                              }
                            }}
                          >
                            담당자 배정 취소
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="flex items-center space-x-2 h-7 px-2 -ml-2">
                        <Avatar className="h-6 w-6 border border-indigo-100">
                          <AvatarFallback className="text-[10px] bg-indigo-50 text-indigo-700">
                            {currentAssignee?.name?.substring(0,1).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-slate-700">{currentAssignee?.name || '담당자 없음'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-title">제목 <span className="text-red-500">*</span></Label>
                  <Input 
                    id="edit-title" 
                    value={selectedTask.title} 
                    onChange={(e) => setSelectedTask({...selectedTask, title: e.target.value})} 
                    required 
                    readOnly={!canManageBoard && selectedTask.creator_id !== user?.id && selectedTask.assignee_id !== user?.id}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-desc">상세 설명</Label>
                  <textarea 
                    id="edit-desc" 
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="작업에 대한 상세한 내용을 이곳에 기록하세요."
                    value={selectedTask.description || ''} 
                    onChange={(e) => setSelectedTask({...selectedTask, description: e.target.value})}
                    readOnly={!canManageBoard && selectedTask.creator_id !== user?.id && selectedTask.assignee_id !== user?.id}
                  />
                </div>
              </div>
            );})()}
            
            <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
              <div className="text-xs text-muted-foreground">
                {(!canManageBoard && selectedTask?.creator_id !== user?.id && selectedTask?.assignee_id !== user?.id) && 
                  "수정 권한이 없습니다 (보드 관리자, 요청자, 담당자만 수정 가능)"
                }
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" type="button" onClick={() => setIsTaskDetailOpen(false)}>닫기</Button>
                {/* 편집 권한이 있을 경우에만 저장 버튼 활성화 */}
                {(canManageBoard || selectedTask?.creator_id === user?.id || selectedTask?.assignee_id === user?.id) && (
                  <Button type="submit" disabled={isUpdatingTask || !selectedTask?.title.trim()}>
                    {isUpdatingTask ? '저장 중...' : '변경사항 저장'}
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
