import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ClaimsService } from '../../core/services/claims.service';
import { ClaimImagesService } from '../../core/services/claim-images.service';
import { ClaimCommentsService } from '../../core/services/claim-comments.service';
import { TendersService } from '../../core/services/tenders.service';
import { TenderOptionsService } from '../../core/services/tender-options.service';
import { VotesService } from '../../core/services/votes.service';
import { SessionService } from '../../core/services/session.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { ClaimInterface } from '../../core/interfaces/claim';
import { ClaimCommentInterface } from '../../core/interfaces/claim-comment';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

@Component({
  selector: 'app-claims',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzFormModule,
    NzSelectModule,
    NzInputModule,
    NzBadgeModule,
    NzPopconfirmModule,
    NzMessageModule,
    NzDatePickerModule,
    NzInputNumberModule
  ],
  templateUrl: './claims.component.html',
  styleUrl: './claims.component.scss'
})
export class ClaimsComponent implements OnInit {
  claims: ClaimInterface[] = [];
  isLoading = false;
  cmpUuid = '';
  usrUuid = '';

  // Filtros
  statusFilter = '';
  typeFilter = '';
  priorityFilter = '';

  // Detalle Modal
  isDetailVisible = false;
  selectedClaim: any = null;
  comments: ClaimCommentInterface[] = [];
  newCommentText = '';
  isSubmittingComment = false;
  claimImages: any[] = [];

  // Licitación y Votaciones
  activeTender: any = null;
  tenderOptions: any[] = [];
  votesList: any[] = [];
  isTenderLoading = false;
  isSavingTender = false;
  isSavingTenderOption = false;
  tenderForm!: FormGroup;
  tenderOptionForm!: FormGroup;

  // Moderación Modal
  isStatusVisible = false;
  statusForm!: FormGroup;
  isSavingStatus = false;

  // Evidencia de Resolución (Foto "Después")
  resolutionImageBase64: string | null = null;
  resolutionImageFileName: string | null = null;

  constructor(
    private fb: FormBuilder,
    private claimsService: ClaimsService,
    private _claimImagessService: ClaimImagesService,
    private _claimCommentsService: ClaimCommentsService,
    private _tendersService: TendersService,
    private _tenderOptionsService: TenderOptionsService,
    private _votesService: VotesService,
    private sessionService: SessionService,
    private message: NzMessageService,
    private notificationsService: NotificationsService
  ) {
    this.initStatusForm();
    this.initTenderForms();
  }

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;
    this.usrUuid = session?.identity?.usr_uuid || '';
    this.loadClaims();
  }

  public initStatusForm(): void {
    this.statusForm = this.fb.group({
      cla_status: ['Abierto', [Validators.required]]
    });
  }

  public initTenderForms(): void {
    this.tenderForm = this.fb.group({
      ten_votingdeadline: [null, [Validators.required]]
    });
    this.tenderOptionForm = this.fb.group({
      tenopt_providername: ['', [Validators.required, Validators.minLength(3)]],
      tenopt_amount: [null, [Validators.required, Validators.min(0.01)]],
      tenopt_details: ['']
    });
  }

  public loadClaims(): void {
    this.isLoading = true;
    const filters: any = {};
    if (this.statusFilter) filters.cla_status = this.statusFilter;
    if (this.typeFilter) filters.cla_type = this.typeFilter;
    if (this.priorityFilter) filters.cla_priority = this.priorityFilter;

    this.claimsService.getClaims(this.cmpUuid, filters).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.claims = res.data || [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.message.error('No se pudieron cargar los reclamos.');
      }
    });
  }

  public applyFilters(): void {
    this.loadClaims();
  }

  public clearFilters(): void {
    this.statusFilter = '';
    this.typeFilter = '';
    this.priorityFilter = '';
    this.loadClaims();
  }

  public showDetailModal(claim: ClaimInterface): void {
    this.selectedClaim = claim;
    this.isDetailVisible = true;
    this.newCommentText = '';
    if (claim.cla_uuid) {
      this.loadComments(claim.cla_uuid);
      this.loadImages(claim.cla_uuid);
      this.loadTenderForClaim(claim.cla_uuid);
    }
  }

  public closeDetailModal(): void {
    this.isDetailVisible = false;
    this.selectedClaim = null;
    this.comments = [];
    this.claimImages = [];
    this.activeTender = null;
    this.tenderOptions = [];
    this.votesList = [];
  }

  public loadTenderForClaim(claUuid: string): void {
    this.isTenderLoading = true;
    this.activeTender = null;
    this.tenderOptions = [];
    this.votesList = [];

    this._tendersService.getTenders(this.cmpUuid, claUuid).subscribe({
      next: (res: any) => {
        if (res.success && res.data && res.data.length > 0) {
          this.activeTender = res.data[0];
          const tenUuid = this.activeTender.ten_uuid;
          this.loadTenderOptionsAndVotes(claUuid, tenUuid);
        } else {
          this.isTenderLoading = false;
        }
      },
      error: (err: any) => {
        this.isTenderLoading = false;
        console.error('Error al cargar licitaciones:', err);
      }
    });
  }

  public loadTenderOptionsAndVotes(claUuid: string, tenUuid: string): void {
    this._tenderOptionsService.getTenderOptions(this.cmpUuid, claUuid, tenUuid).subscribe({
      next: (resOpt: any) => {
        if (resOpt.success) {
          this.tenderOptions = resOpt.data || [];
        }
        this._votesService.getVotes(this.cmpUuid, claUuid, tenUuid).subscribe({
          next: (resVotes: any) => {
            this.isTenderLoading = false;
            if (resVotes.success) {
              this.votesList = resVotes.data || [];
              this.calculateVotes();
            }
          },
          error: (err: any) => {
            this.isTenderLoading = false;
            console.error('Error al cargar votos:', err);
          }
        });
      },
      error: (err: any) => {
        this.isTenderLoading = false;
        console.error('Error al cargar opciones de licitación:', err);
      }
    });
  }

  public calculateVotes(): void {
    this.tenderOptions.forEach(opt => {
      const optVotes = this.votesList.filter(v => v.tenopt_uuid === opt.tenopt_uuid);
      opt.votesCount = optVotes.length;
      opt.percentage = this.votesList.length > 0 ? (optVotes.length / this.votesList.length) * 100 : 0;
    });
  }

  public startTender(): void {
    if (this.tenderForm.valid && this.selectedClaim?.cla_uuid) {
      this.isSavingTender = true;
      const payload = {
        cmp_uuid: this.cmpUuid,
        cla_uuid: this.selectedClaim.cla_uuid,
        ten_votingdeadline: this.tenderForm.value.ten_votingdeadline,
        ten_status: 'Activa'
      };

      this._tendersService.saveTender(payload).subscribe({
        next: (res: any) => {
          this.isSavingTender = false;
          if (res.success) {
            this.message.success('Convocatoria de licitación iniciada con éxito.');
            this.updateClaimStatusToLicitacion();
            if (this.selectedClaim?.cla_uuid) {
              this.loadTenderForClaim(this.selectedClaim.cla_uuid);
            }
          }
        },
        error: (err: any) => {
          this.isSavingTender = false;
          console.error(err);
          this.message.error('Error al iniciar licitación.');
        }
      });
    } else {
      Object.values(this.tenderForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  private updateClaimStatusToLicitacion(): void {
    if (!this.selectedClaim?.cla_uuid) return;
    const payload = {
      ...this.selectedClaim,
      cla_status: 'En Licitacion'
    };
    this.claimsService.updateClaim(this.cmpUuid, this.selectedClaim.cla_uuid, payload).subscribe({
      next: () => {
        this.loadClaims();
        if (this.selectedClaim) {
          this.selectedClaim.cla_status = 'En Licitacion';
          this.sendStatusNotification(this.selectedClaim, 'En Licitacion');
        }
      },
      error: (err) => console.error('Error actualizando estado del reclamo:', err)
    });
  }

  public addTenderOption(): void {
    if (this.tenderOptionForm.valid && this.selectedClaim?.cla_uuid && this.activeTender?.ten_uuid) {
      this.isSavingTenderOption = true;
      const formValue = this.tenderOptionForm.value;
      const payload = {
        cmp_uuid: this.cmpUuid,
        cla_uuid: this.selectedClaim.cla_uuid,
        ten_uuid: this.activeTender.ten_uuid,
        tenopt_providername: formValue.tenopt_providername,
        tenopt_amount: formValue.tenopt_amount,
        tenopt_details: formValue.tenopt_details
      };

      this._tenderOptionsService.saveTenderOption(payload).subscribe({
        next: (res: any) => {
          this.isSavingTenderOption = false;
          if (res.success) {
            this.message.success('Presupuesto de proveedor agregado con éxito.');
            this.tenderOptionForm.reset();
            if (this.selectedClaim?.cla_uuid && this.activeTender?.ten_uuid) {
              this.loadTenderOptionsAndVotes(this.selectedClaim.cla_uuid, this.activeTender.ten_uuid);
            }
          }
        },
        error: (err: any) => {
          this.isSavingTenderOption = false;
          console.error(err);
          this.message.error('Error al agregar propuesta.');
        }
      });
    } else {
      Object.values(this.tenderOptionForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  public deleteTenderOption(option: any): void {
    if (!this.selectedClaim?.cla_uuid || !this.activeTender?.ten_uuid || !option.tenopt_uuid) return;
    this._tenderOptionsService.deleteTenderOption(this.cmpUuid, this.selectedClaim.cla_uuid, this.activeTender.ten_uuid, option.tenopt_uuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success('Propuesta eliminada con éxito.');
          if (this.selectedClaim?.cla_uuid && this.activeTender?.ten_uuid) {
            this.loadTenderOptionsAndVotes(this.selectedClaim.cla_uuid, this.activeTender.ten_uuid);
          }
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('No se pudo eliminar la propuesta.');
      }
    });
  }

  public closeTender(status: 'Cerrada' | 'Desierta'): void {
    if (!this.selectedClaim?.cla_uuid || !this.activeTender?.ten_uuid) return;
    const payload = {
      ...this.activeTender,
      ten_status: status
    };
    this._tendersService.updateTender(this.cmpUuid, this.selectedClaim.cla_uuid, this.activeTender.ten_uuid, payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success(`Convocatoria marcada como ${status}.`);
          if (status === 'Cerrada') {
            this.updateClaimStatusToEnObra();
          }
          if (this.selectedClaim?.cla_uuid) {
            this.loadTenderForClaim(this.selectedClaim.cla_uuid);
          }
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('Error al cerrar licitación.');
      }
    });
  }

  private updateClaimStatusToEnObra(): void {
    if (!this.selectedClaim?.cla_uuid) return;
    const payload = {
      ...this.selectedClaim,
      cla_status: 'En Obra'
    };
    this.claimsService.updateClaim(this.cmpUuid, this.selectedClaim.cla_uuid, payload).subscribe({
      next: () => {
        this.loadClaims();
        if (this.selectedClaim) {
          this.selectedClaim.cla_status = 'En Obra';
          this.sendStatusNotification(this.selectedClaim, 'En Obra');
        }
      },
      error: (err) => console.error(err)
    });
  }


  public loadComments(claUuid: string): void {
    this._claimCommentsService.getClaimComments(this.cmpUuid, claUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.comments = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Error al cargar comentarios:', err);
      }
    });
  }

  public loadImages(claUuid: string): void {
    this._claimImagessService.getClaimImages(this.cmpUuid, claUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.claimImages = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Error al cargar imágenes:', err);
      }
    });
  }

  public sendComment(): void {
    if (!this.newCommentText.trim() || !this.selectedClaim?.cla_uuid) return;
    this.isSubmittingComment = true;
    const session = this.sessionService.getCurrentSession();
    const adminUsrUuid = session?.identity?.usr_uuid || '';

    const commentPayload = {
      cmp_uuid: this.cmpUuid,
      cla_uuid: this.selectedClaim.cla_uuid,
      usr_uuid: adminUsrUuid,
      clac_text: this.newCommentText.trim()
    };

    this._claimCommentsService.saveClaimComment(commentPayload).subscribe({
      next: (res: any) => {
        this.isSubmittingComment = false;
        this.newCommentText = '';
        if (res.success) {
          this.comments.push(res.data);
          
          if (this.selectedClaim && this.selectedClaim.usr_uuid) {
            const notification = {
              usr_uuid: this.selectedClaim.usr_uuid,
              cmp_uuid: this.cmpUuid,
              ntf_title: 'Nuevo comentario en tu Reclamo',
              ntf_message: `La administración ha dejado un comentario en tu reclamo: "${this.selectedClaim.cla_title}".`,
              ntf_type: 'info' as const,
              ntf_isread: false,
              ntf_actionurl: '/user/my-claims'
            };
            this.notificationsService.saveNotification(notification).subscribe();
          }
        } else {
          if (this.selectedClaim?.cla_uuid) {
            this.loadComments(this.selectedClaim.cla_uuid);
          }
        }
      },
      error: (err: any) => {
        this.isSubmittingComment = false;
        console.error('Error al enviar comentario:', err);
        this.message.error('No se pudo enviar el comentario.');
      }
    });
  }

  public showStatusModal(claim: ClaimInterface): void {
    this.selectedClaim = claim;
    this.statusForm.reset({
      cla_status: claim.cla_status
    });
    this.resolutionImageBase64 = null;
    this.resolutionImageFileName = null;
    this.isStatusVisible = true;
  }

  public closeStatusModal(): void {
    this.isStatusVisible = false;
  }

  public onResolutionFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.message.warning('La imagen no debe superar los 2MB.');
        return;
      }
      this.resolutionImageFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.resolutionImageBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  public saveStatus(): void {
    if (this.statusForm.valid && this.selectedClaim?.cla_uuid) {
      this.isSavingStatus = true;
      const updatedStatus = this.statusForm.value.cla_status;

      const payload = {
        cla_title: this.selectedClaim.cla_title,
        cla_description: this.selectedClaim.cla_description,
        cla_type: this.selectedClaim.cla_type,
        usr_uuid: this.selectedClaim.usr_uuid,
        uni_uuid: this.selectedClaim.uni_uuid,
        sit_uuid: this.selectedClaim.sit_uuid,
        spa_uuid: this.selectedClaim.spa_uuid,
        cla_status: updatedStatus,
        cla_priority: this.selectedClaim.cla_priority || 'Media'
      };

      this.claimsService.updateClaim(this.cmpUuid, this.selectedClaim.cla_uuid, payload).subscribe({
        next: (res: any) => {
          if (updatedStatus === 'FinalizadoAprobado' && this.resolutionImageBase64 && this.selectedClaim?.cla_uuid) {
            const imgPayload = {
              cmp_uuid: this.cmpUuid,
              cla_uuid: this.selectedClaim.cla_uuid,
              claimg_uuid: this.generateUUID(),
              claimg_image: this.resolutionImageBase64,
              claimg_moment: 'Despues'
            };
            this._claimImagessService.saveClaimImage(imgPayload).subscribe({
              next: () => {
                this.isSavingStatus = false;
                this.isStatusVisible = false;
                this.message.success('Estado del reclamo actualizado y evidencia guardada');
                if (this.selectedClaim) this.sendStatusNotification(this.selectedClaim, updatedStatus);
                this.loadClaims();
              },
              error: (err: any) => {
                this.isSavingStatus = false;
                console.error(err);
                this.message.warning('Estado actualizado, pero falló la subida de evidencia.');
                this.isStatusVisible = false;
                if (this.selectedClaim) this.sendStatusNotification(this.selectedClaim, updatedStatus);
                this.loadClaims();
              }
            });
          } else {
            this.isSavingStatus = false;
            this.isStatusVisible = false;
            this.message.success('Estado del reclamo actualizado con éxito');
            if (this.selectedClaim) this.sendStatusNotification(this.selectedClaim, updatedStatus);
            this.loadClaims();
          }
        },
        error: (err: any) => {
          this.isSavingStatus = false;
          console.error(err);
          this.message.error('Error al actualizar el estado del reclamo.');
        }
      });
    }
  }

  public deleteClaim(claim: ClaimInterface): void {
    if (!claim.cla_uuid) return;
    this.claimsService.deleteClaim(this.cmpUuid, claim.cla_uuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success('Reclamo eliminado con éxito');
          this.loadClaims();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('No se pudo eliminar el reclamo.');
      }
    });
  }

  public getBadgeStatus(status: string): 'success' | 'error' | 'warning' | 'processing' | 'default' {
    switch (status) {
      case 'Abierto':
        return 'processing';
      case 'En Licitacion':
        return 'warning';
      case 'Aprobado':
      case 'En Obra':
        return 'warning';
      case 'FinalizadoAprobado':
        return 'success';
      case 'Rechazado':
        return 'error';
      default:
        return 'default';
    }
  }

  public formatStatus(status: string): string {
    switch (status) {
      case 'En Licitacion':
        return 'En Licitación';
      case 'FinalizadoAprobado':
        return 'Resuelto';
      case 'En Obra':
        return 'En Reparación';
      default:
        return status;
    }
  }

  public getCardBorderColor(type: string): string {
    switch (type) {
      case 'Reclamo':
        return '#ff4d4f';
      case 'Sugerencia':
        return '#1890ff';
      case 'Propuesta':
        return '#52c41a';
      default:
        return '#d9d9d9';
    }
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private sendStatusNotification(claim: ClaimInterface, status: string): void {
    if (!claim.usr_uuid) return;
    const friendlyStatus = this.formatStatus(status);
    const notification = {
      usr_uuid: claim.usr_uuid,
      cmp_uuid: this.cmpUuid,
      ntf_title: 'Reclamo Actualizado',
      ntf_message: `Tu reclamo "${claim.cla_title}" ha cambiado de estado a "${friendlyStatus}".`,
      ntf_type: (status === 'Rechazado' ? 'error' : status === 'FinalizadoAprobado' ? 'success' : 'info') as any,
      ntf_isread: false,
      ntf_actionurl: '/user/my-claims'
    };
    this.notificationsService.saveNotification(notification).subscribe();
  }
}
