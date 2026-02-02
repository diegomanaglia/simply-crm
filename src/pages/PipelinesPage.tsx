import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Edit2, Trash2, GitBranch, RefreshCw } from 'lucide-react';
import { useCRMStore, resetToMockData } from '@/store/crmStore';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateSlug } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PipelinesPage() {
    const { pipelines, addPipeline, updatePipeline, deletePipeline, selectedPipelineId, selectPipeline } = useCRMStore();
    const { slug } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pipelineName, setPipelineName] = useState('');
    const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null);
    const [deletingPipelineId, setDeletingPipelineId] = useState<string | null>(null);

    // Sync URL slug with store selection
    useEffect(() => {
        if (slug) {
            const pipeline = pipelines.find(p => generateSlug(p.name) === slug);
            if (pipeline) {
                if (pipeline.id !== selectedPipelineId) {
                    selectPipeline(pipeline.id);
                }
            } else {
                // Slug found but no matching pipeline? Redirect to list
                navigate('/pipelines', { replace: true });
                selectPipeline(null);
            }
        } else {
            // No slug, ensure no pipeline is selected
            if (selectedPipelineId) {
                selectPipeline(null);
            }
        }
    }, [slug, pipelines, selectedPipelineId, selectPipeline, navigate]);

    const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);

    const handleCreatePipeline = () => {
        if (pipelineName.trim()) {
            const newSlug = generateSlug(pipelineName.trim());
            const exists = pipelines.some(p => generateSlug(p.name) === newSlug);

            if (exists) {
                toast({
                    title: "Erro ao criar pipeline",
                    description: "Já existe um pipeline com este nome.",
                    variant: "destructive"
                });
                return;
            }

            addPipeline(pipelineName.trim());
            setPipelineName('');
            setShowCreateModal(false);
        }
    };

    const handleEditPipeline = () => {
        if (editingPipelineId && pipelineName.trim()) {
            const newSlug = generateSlug(pipelineName.trim());
            const exists = pipelines.some(p => p.id !== editingPipelineId && generateSlug(p.name) === newSlug);

            if (exists) {
                toast({
                    title: "Erro ao editar pipeline",
                    description: "Já existe um pipeline com este nome.",
                    variant: "destructive"
                });
                return;
            }

            updatePipeline(editingPipelineId, pipelineName.trim());

            // If we are editing the currently viewed pipeline, the slug might change
            // We should probably redirect to the new slug if it was selected
            // But updatePipeline updates the store, and the effect might catch it if the slug changes?
            // Actually, if we are in list view, it doesn't matter.
            // If we are in detail view, URL needs to update? 
            // Current edit is only from the list view dropdown. The detail view Kanban doesn't have edit name there yet (or maybe it does inside KanbanBoard).
            // Assuming edit is from list for now.

            setPipelineName('');
            setEditingPipelineId(null);
            setShowEditModal(false);
        }
    };

    const handleDeletePipeline = () => {
        if (deletingPipelineId) {
            deletePipeline(deletingPipelineId);
            setDeletingPipelineId(null);
            setShowDeleteDialog(false);
        }
    };

    const openEditModal = (id: string, name: string) => {
        setEditingPipelineId(id);
        setPipelineName(name);
        setShowEditModal(true);
    };

    const openDeleteDialog = (id: string) => {
        setDeletingPipelineId(id);
        setShowDeleteDialog(true);
    };

    const handlePipelineClick = (pipeline: any) => {
        const slug = generateSlug(pipeline.name);
        navigate(`/pipeline/${slug}`);
    };

    // Show Kanban board if a pipeline is selected
    if (selectedPipeline) {
        return (
            <KanbanBoard
                pipeline={selectedPipeline}
                onBack={() => navigate('/pipelines')}
            />
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Pipelines</h1>
                    <p className="text-muted-foreground">Gerencie seus funis de vendas</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={resetToMockData} title="Carregar dados de exemplo">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Resetar Dados
                    </Button>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Novo Pipeline
                    </Button>
                </div>
            </div>

            {/* Pipeline Cards */}
            {pipelines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-border rounded-xl bg-card">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <GitBranch className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum pipeline criado</h3>
                    <p className="text-muted-foreground text-center mb-4 max-w-sm">
                        Crie seu primeiro pipeline para começar a organizar seus negócios
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Criar Pipeline
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pipelines.map((pipeline) => {
                        const totalValue = pipeline.deals.reduce((sum, deal) => sum + deal.value, 0);
                        const wonDeals = pipeline.deals.filter(
                            (d) => pipeline.phases.find((p) => p.id === d.phaseId)?.type === 'won'
                        ).length;

                        return (
                            <div
                                key={pipeline.id}
                                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-card-hover hover:border-primary/20 transition-all duration-200 group"
                                onClick={() => handlePipelineClick(pipeline)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <GitBranch className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-foreground">{pipeline.name}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                {pipeline.phases.length} fases
                                            </p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openEditModal(pipeline.id, pipeline.name);
                                                }}
                                            >
                                                <Edit2 className="w-4 h-4 mr-2" />
                                                Editar
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openDeleteDialog(pipeline.id);
                                                }}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                        <p className="text-lg font-semibold text-foreground">{pipeline.deals.length}</p>
                                        <p className="text-xs text-muted-foreground">Negócios</p>
                                    </div>
                                    <div className="bg-success/10 rounded-lg p-3 text-center">
                                        <p className="text-lg font-semibold text-success">{wonDeals}</p>
                                        <p className="text-xs text-muted-foreground">Ganhos</p>
                                    </div>
                                    <div className="bg-primary/10 rounded-lg p-3 text-center">
                                        <p className="text-sm font-semibold text-primary">
                                            {new Intl.NumberFormat('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                                notation: 'compact',
                                            }).format(totalValue)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Pipeline Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Pipeline</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="pipelineName">Nome do Pipeline</Label>
                            <Input
                                id="pipelineName"
                                value={pipelineName}
                                onChange={(e) => setPipelineName(e.target.value)}
                                placeholder="Ex: Vendas B2B"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreatePipeline()}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button onClick={handleCreatePipeline} className="flex-1">
                                Criar Pipeline
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Pipeline Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Pipeline</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="editPipelineName">Nome do Pipeline</Label>
                            <Input
                                id="editPipelineName"
                                value={pipelineName}
                                onChange={(e) => setPipelineName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEditPipeline()}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button onClick={handleEditPipeline} className="flex-1">
                                Salvar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Pipeline</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este pipeline? Todos os negócios associados serão perdidos.
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeletePipeline}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
