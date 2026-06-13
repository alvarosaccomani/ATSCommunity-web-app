import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ClaimsService } from '../../core/services/claims.service';
import { ClaimImagesService } from '../../core/services/claim-images.service';
import { ClaimCommentsService } from '../../core/services/claim-comments.service';
import { UserUnitsService } from '../../core/services/user-units.service';
import { TendersService } from '../../core/services/tenders.service';
import { TenderOptionsService } from '../../core/services/tender-options.service';
import { VotesService } from '../../core/services/votes.service';
import { SessionService } from '../../core/services/session.service';
import { ClaimInterface } from '../../core/interfaces/claim';
import { ClaimCommentInterface } from '../../core/interfaces/claim-comment';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-my-claims',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzMessageModule
  ],
  templateUrl: './my-claims.component.html',
  styleUrl: './my-claims.component.scss'
})
export class MyClaimsComponent implements OnInit {
  claims: ClaimInterface[] = [];
  userUnits: any[] = [];
  isLoading = false;
  isSaving = false;
  
  // Modal control
  isModalVisible = false;
  claimForm!: FormGroup;

  // Detalle y Comentarios Modal
  isDetailVisible = false;
  selectedClaim: ClaimInterface | null = null;
  comments: ClaimCommentInterface[] = [];
  newCommentText = '';
  isSubmittingComment = false;
  claimImages: any[] = [];

  // Licitación y Votaciones
  activeTender: any = null;
  tenderOptions: any[] = [];
  votesList: any[] = [];
  userVote: any = null;
  isTenderLoading = false;
  isVoting = false;

  // Imagen Adjunta en creación
  selectedImageBase64: string | null = null;
  imageFileName: string | null = null;

  cmpUuid = '';
  usrUuid = '';

  constructor(
    private fb: FormBuilder,
    private claimsService: ClaimsService,
    private _claimImagessService: ClaimImagesService,
    private _claimCommentsService: ClaimCommentsService,
    private userUnitsService: UserUnitsService,
    private _tendersService: TendersService,
    private _tenderOptionsService: TenderOptionsService,
    private _votesService: VotesService,
    private sessionService: SessionService,
    private message: NzMessageService
  ) {
    this.initForm();
  }


  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.usrUuid = session?.identity?.usr_uuid || '';
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;

    if (this.usrUuid) {
      this.loadClaims();
      this.loadUserUnits();
    } else {
      this.message.warning('No se pudo identificar tu sesión.');
    }
  }  public initForm(): void {
    this.claimForm = this.fb.group({
      cla_title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      cla_description: ['', [Validators.required, Validators.minLength(10)]],
      cla_type: ['Reclamo', [Validators.required]],
      uni_uuid: ['', [Validators.required]],
      cla_priority: ['Media', [Validators.required]]
    });
  }

  public loadClaims(): void {
    this.isLoading = true;
    this.claimsService.getClaims(this.cmpUuid, { usr_uuid: this.usrUuid }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.claims = res.data || [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.message.error('No se pudieron cargar tus reportes.');
      }
    });
  }

  public loadUserUnits(): void {
    this.userUnitsService.getUserUnits(this.cmpUuid, this.usrUuid).subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.userUnits = res.data || [];
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  public showCreateModal(): void {
    if (this.userUnits.length === 0) {
      this.message.warning('Debes tener al menos una unidad funcional asignada para reportar un incidente.');
      return;
    }
    this.claimForm.reset({
      cla_title: '',
      cla_description: '',
      cla_type: 'Reclamo',
      uni_uuid: this.userUnits[0]?.uni_uuid || '',
      cla_priority: 'Media'
    });
    this.selectedImageBase64 = null;
    this.imageFileName = null;
    this.isModalVisible = true;
  }

  public handleCancel(): void {
    this.isModalVisible = false;
  }

  public onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.message.warning('La imagen no debe superar los 2MB.');
        return;
      }
      this.imageFileName = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImageBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  public saveClaim(): void {
    if (this.claimForm.valid) {
      this.isSaving = true;
      const generatedClaimUuid = this.generateUUID();

      const payload = {
        ...this.claimForm.value,
        cmp_uuid: this.cmpUuid,
        usr_uuid: this.usrUuid,
        cla_uuid: generatedClaimUuid,
        cla_status: 'Abierto'
      };

      this.claimsService.saveClaim(payload).subscribe({
        next: (res: any) => {
          if (this.selectedImageBase64) {
            const imgPayload = {
              cmp_uuid: this.cmpUuid,
              cla_uuid: generatedClaimUuid,
              claimg_uuid: this.generateUUID(),
              claimg_image: this.selectedImageBase64,
              claimg_moment: 'Antes'
            };
            this._claimImagessService.saveClaimImage(imgPayload).subscribe({
              next: () => {
                this.isSaving = false;
                this.isModalVisible = false;
                this.message.success('Reporte creado con éxito');
                this.loadClaims();
              },
              error: (err: any) => {
                this.isSaving = false;
                console.error(err);
                this.message.warning('Reclamo creado, pero no se pudo subir la imagen.');
                this.isModalVisible = false;
                this.loadClaims();
              }
            });
          } else {
            this.isSaving = false;
            this.isModalVisible = false;
            this.message.success('Reporte creado con éxito');
            this.loadClaims();
          }
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error(err);
          this.message.error(err.error?.error || 'Error al enviar el reporte.');
        }
      });
    } else {
      Object.values(this.claimForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  // Detalle, Imágenes y Comentarios
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
    this.userVote = null;
  }

  public loadTenderForClaim(claUuid: string): void {
    this.isTenderLoading = true;
    this.activeTender = null;
    this.tenderOptions = [];
    this.votesList = [];
    this.userVote = null;

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
              this.userVote = this.votesList.find(v => v.usr_uuid === this.usrUuid);
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

  public castVote(option: any): void {
    if (!this.selectedClaim?.cla_uuid || !this.activeTender?.ten_uuid || !option.tenopt_uuid) return;
    this.isVoting = true;

    const payload = {
      cmp_uuid: this.cmpUuid,
      cla_uuid: this.selectedClaim.cla_uuid,
      ten_uuid: this.activeTender.ten_uuid,
      usr_uuid: this.usrUuid,
      tenopt_uuid: option.tenopt_uuid
    };

    this._votesService.saveVote(payload).subscribe({
      next: (res: any) => {
        this.isVoting = false;
        if (res.success) {
          this.message.success('Tu voto ha sido registrado con éxito.');
          if (this.selectedClaim?.cla_uuid && this.activeTender?.ten_uuid) {
            this.loadTenderOptionsAndVotes(this.selectedClaim.cla_uuid, this.activeTender.ten_uuid);
          }
        }
      },
      error: (err: any) => {
        this.isVoting = false;
        console.error(err);
        this.message.error(err.error?.error || 'Error al registrar tu voto.');
      }
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
    const commentPayload = {
      cmp_uuid: this.cmpUuid,
      cla_uuid: this.selectedClaim.cla_uuid,
      usr_uuid: this.usrUuid,
      clac_text: this.newCommentText.trim()
    };
    this._claimCommentsService.saveClaimComment(commentPayload).subscribe({
      next: (res: any) => {
        this.isSubmittingComment = false;
        this.newCommentText = '';
        if (res.success) {
          this.comments.push(res.data);
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
        return '#ff4d4f'; // Rojo
      case 'Sugerencia':
        return '#1890ff'; // Azul
      case 'Propuesta':
        return '#52c41a'; // Verde
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
}
