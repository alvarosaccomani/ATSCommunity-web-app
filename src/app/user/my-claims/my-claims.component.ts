import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ClaimsService } from '../../core/services/claims.service';
import { UserUnitsService } from '../../core/services/user-units.service';
import { SessionService } from '../../core/services/session.service';
import { ClaimInterface } from '../../core/interfaces/claim/claim.interface';
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

  cmpUuid = '';
  usrUuid = '';

  constructor(
    private fb: FormBuilder,
    private claimsService: ClaimsService,
    private userUnitsService: UserUnitsService,
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
  }

  public initForm(): void {
    this.claimForm = this.fb.group({
      cla_title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      cla_description: ['', [Validators.required, Validators.minLength(10)]],
      cla_type: ['Reclamo', [Validators.required]],
      uni_uuid: ['', [Validators.required]]
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
          // Guardar las relaciones de unidades para asociar al reclamo
          this.userUnits = res.data || [];
          // Si no tenemos detalles enriquecidos, de todas formas el servicio getClaims en el backend traerá el uni_code gracias al join.
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
      uni_uuid: this.userUnits[0]?.uni_uuid || ''
    });
    this.isModalVisible = true;
  }

  public handleCancel(): void {
    this.isModalVisible = false;
  }

  public saveClaim(): void {
    if (this.claimForm.valid) {
      this.isSaving = true;

      // Generar un UUID aleatorio para cla_uuid en el cliente
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
          this.isSaving = false;
          this.isModalVisible = false;
          this.message.success('Reporte creado con éxito');
          this.loadClaims();
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
