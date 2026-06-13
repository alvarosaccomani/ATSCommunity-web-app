import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FeesService } from '../../core/services/fees.service';
import { SessionService } from '../../core/services/session.service';
import { UnitsService } from '../../core/services/units.service';
import { UserUnitsService } from '../../core/services/user-units.service';
import { NotificationsService } from '../../core/services/notifications.service';
import { FeeInterface } from '../../core/interfaces/fee/fee.interface';
import { UnitInterface } from '../../core/interfaces/unit';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-fees',
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
    NzInputModule,
    NzSelectModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzBadgeModule,
    NzPopconfirmModule,
    NzMessageModule
  ],
  templateUrl: './fees.component.html',
  styleUrl: './fees.component.scss'
})
export class FeesComponent implements OnInit {
  fees: FeeInterface[] = [];
  units: UnitInterface[] = [];
  unitAssignments: any[] = [];
  isLoading = false;
  isAssignmentsLoading = false;
  cmpUuid = '';

  // Filtros
  statusFilter = '';
  unitFilter = '';
  periodFilter: Date | null = null;

  // Modal Control (Crear)
  isCreateModalVisible = false;
  feeForm!: FormGroup;
  isSaving = false;

  // Modal Control (Editar)
  isEditModalVisible = false;
  editForm!: FormGroup;
  isUpdating = false;
  selectedFee: FeeInterface | null = null;

  constructor(
    private fb: FormBuilder,
    private feesService: FeesService,
    private sessionService: SessionService,
    private unitsService: UnitsService,
    private userUnitsService: UserUnitsService,
    private message: NzMessageService,
    private notificationsService: NotificationsService
  ) {
    this.initCreateForm();
    this.initEditForm();
  }

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;
    this.loadFees();
    this.loadUnits();
  }

  public initCreateForm(): void {
    this.feeForm = this.fb.group({
      uni_uuid: ['', [Validators.required]],
      usruni_uuid: ['', [Validators.required]],
      fee_period: [null, [Validators.required]], // Will map Date to 'YYYY-MM'
      fee_amount: [null, [Validators.required, Validators.min(0.01)]],
      fee_duedate: [null, [Validators.required]],
      fee_status: ['Pendiente', [Validators.required]]
    });

    // Escuchar cambios en la unidad seleccionada para cargar habitantes y pre-rellenar el monto
    this.feeForm.get('uni_uuid')?.valueChanges.subscribe(uniUuid => {
      this.feeForm.get('usruni_uuid')?.setValue('');
      this.unitAssignments = [];
      if (uniUuid) {
        this.loadUnitAssignments(uniUuid);
        // Pre-rellenar el monto
        const selectedUnit = this.units.find(u => u.uni_uuid === uniUuid);
        if (selectedUnit && selectedUnit.uni_baseamountcustom !== undefined) {
          this.feeForm.get('fee_amount')?.setValue(Number(selectedUnit.uni_baseamountcustom));
        }
      }
    });
  }

  public initEditForm(): void {
    this.editForm = this.fb.group({
      fee_amount: [null, [Validators.required, Validators.min(0.01)]],
      fee_duedate: [null, [Validators.required]],
      fee_status: ['Pendiente', [Validators.required]],
      fee_period: ['', [Validators.required]]
    });
  }

  public loadFees(): void {
    this.isLoading = true;
    const filters: any = {};
    if (this.statusFilter) filters.fee_status = this.statusFilter;
    if (this.unitFilter) filters.uni_uuid = this.unitFilter;
    if (this.periodFilter) {
      filters.fee_period = this.formatPeriod(this.periodFilter);
    }

    this.feesService.getFees(this.cmpUuid, filters).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.fees = res.data || [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.message.error('No se pudieron cargar las expensas.');
      }
    });
  }

  public loadUnits(): void {
    this.unitsService.getUnits(this.cmpUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.units = res.data || [];
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  public loadUnitAssignments(uniUuid: string): void {
    this.isAssignmentsLoading = true;
    this.userUnitsService.getUnitUsers(this.cmpUuid, uniUuid).subscribe({
      next: (res: any) => {
        this.isAssignmentsLoading = false;
        if (res.success) {
          // Filtrar solo asignaciones activas
          this.unitAssignments = (res.data || []).filter((a: any) => a.usruni_isactive);
          if (this.unitAssignments.length === 0) {
            this.message.warning('Esta unidad no tiene habitantes activos asignados.');
          } else if (this.unitAssignments.length === 1) {
            // Auto-seleccionar si hay solo uno
            this.feeForm.get('usruni_uuid')?.setValue(this.unitAssignments[0].usruni_uuid);
          }
        }
      },
      error: (err: any) => {
        this.isAssignmentsLoading = false;
        console.error(err);
        this.message.error('No se pudieron cargar los habitantes de la unidad.');
      }
    });
  }

  public applyFilters(): void {
    this.loadFees();
  }

  public clearFilters(): void {
    this.statusFilter = '';
    this.unitFilter = '';
    this.periodFilter = null;
    this.loadFees();
  }

  public showCreateModal(): void {
    this.feeForm.reset({
      uni_uuid: '',
      usruni_uuid: '',
      fee_period: new Date(),
      fee_amount: null,
      fee_duedate: null,
      fee_status: 'Pendiente'
    });
    this.unitAssignments = [];
    this.isCreateModalVisible = true;
  }

  public closeCreateModal(): void {
    this.isCreateModalVisible = false;
  }

  public saveFee(): void {
    if (this.feeForm.valid) {
      this.isSaving = true;
      const formValue = this.feeForm.value;
      const selectedAssignment = this.unitAssignments.find(a => a.usruni_uuid === formValue.usruni_uuid);

      if (!selectedAssignment) {
        this.message.error('Asignación de habitante no válida.');
        this.isSaving = false;
        return;
      }

      const payload = {
        cmp_uuid: this.cmpUuid,
        uni_uuid: formValue.uni_uuid,
        usruni_uuid: formValue.usruni_uuid,
        usr_uuid: selectedAssignment.usr_uuid,
        fee_period: this.formatPeriod(formValue.fee_period),
        fee_amount: formValue.fee_amount,
        fee_duedate: formValue.fee_duedate,
        fee_status: formValue.fee_status
      };

      this.feesService.saveFee(payload).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          this.isCreateModalVisible = false;
          this.message.success('Expensa creada con éxito.');
          
          const notification = {
            usr_uuid: selectedAssignment.usr_uuid,
            cmp_uuid: this.cmpUuid,
            ntf_title: 'Nueva Expensa Emitida',
            ntf_message: `Se ha emitido una nueva expensa por un monto de $${formValue.fee_amount} para el periodo ${this.formatPeriod(formValue.fee_period)}.`,
            ntf_type: 'warning' as const,
            ntf_isread: false,
            ntf_actionurl: '/user/my-fees'
          };
          this.notificationsService.saveNotification(notification).subscribe();

          this.loadFees();
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error(err);
          this.message.error(err.error?.error || 'Error al crear la expensa.');
        }
      });
    } else {
      Object.values(this.feeForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  public showEditModal(fee: FeeInterface): void {
    this.selectedFee = fee;
    this.editForm.reset({
      fee_amount: fee.fee_amount,
      fee_duedate: fee.fee_duedate ? new Date(fee.fee_duedate) : null,
      fee_status: fee.fee_status,
      fee_period: fee.fee_period ? this.parsePeriodToDate(fee.fee_period) : null
    });
    this.isEditModalVisible = true;
  }

  public closeEditModal(): void {
    this.isEditModalVisible = false;
    this.selectedFee = null;
  }

  public updateFee(): void {
    if (this.editForm.valid && this.selectedFee) {
      this.isUpdating = true;
      const formValue = this.editForm.value;

      const payload = {
        fee_period: this.formatPeriod(formValue.fee_period),
        fee_amount: formValue.fee_amount,
        fee_duedate: formValue.fee_duedate,
        fee_status: formValue.fee_status
      };

      const { cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid } = this.selectedFee;
      if (!cmp_uuid || !usr_uuid || !uni_uuid || !usruni_uuid || !fee_uuid) return;

      this.feesService.updateFee(cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid, payload).subscribe({
        next: (res: any) => {
          this.isUpdating = false;
          this.isEditModalVisible = false;
          this.message.success('Expensa actualizada con éxito.');
          this.loadFees();
        },
        error: (err: any) => {
          this.isUpdating = false;
          console.error(err);
          this.message.error(err.error?.error || 'Error al actualizar la expensa.');
        }
      });
    } else {
      Object.values(this.editForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  public deleteFee(fee: FeeInterface): void {
    const { cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid } = fee;
    if (!cmp_uuid || !usr_uuid || !uni_uuid || !usruni_uuid || !fee_uuid) return;

    this.feesService.deleteFee(cmp_uuid, usr_uuid, uni_uuid, usruni_uuid, fee_uuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success('Expensa eliminada con éxito.');
          this.loadFees();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('No se pudo eliminar la expensa.');
      }
    });
  }

  public getBadgeStatus(status: string): 'success' | 'error' | 'warning' | 'processing' | 'default' {
    switch (status) {
      case 'Pendiente':
        return 'processing';
      case 'Pagada':
        return 'success';
      case 'Vencida':
        return 'error';
      default:
        return 'default';
    }
  }

  private formatPeriod(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}`;
  }

  private parsePeriodToDate(period: string): Date | null {
    if (!period) return null;
    const parts = period.split('-');
    if (parts.length === 2) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    }
    return null;
  }
}
