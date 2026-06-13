import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ClaimsService } from '../../core/services/claims.service';
import { ClaimImagesService } from '../../core/services/claim-images.service';
import { ClaimCommentsService } from '../../core/services/claim-comments.service';
import { SessionService } from '../../core/services/session.service';
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
    NzMessageModule
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
  selectedClaim: ClaimInterface | null = null;
  comments: ClaimCommentInterface[] = [];
  newCommentText = '';
  isSubmittingComment = false;
  claimImages: any[] = [];

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
    private sessionService: SessionService,
    private message: NzMessageService
  ) {
    this.initStatusForm();
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
    }
  }

  public closeDetailModal(): void {
    this.isDetailVisible = false;
    this.selectedClaim = null;
    this.comments = [];
    this.claimImages = [];
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
                this.loadClaims();
              },
              error: (err: any) => {
                this.isSavingStatus = false;
                console.error(err);
                this.message.warning('Estado actualizado, pero falló la subida de evidencia.');
                this.isStatusVisible = false;
                this.loadClaims();
              }
            });
          } else {
            this.isSavingStatus = false;
            this.isStatusVisible = false;
            this.message.success('Estado del reclamo actualizado con éxito');
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
}
