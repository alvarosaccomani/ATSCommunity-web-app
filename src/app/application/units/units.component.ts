import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UnitsService } from '../../core/services/units.service';
import { SessionService } from '../../core/services/session.service';
import { UnitInterface } from '../../core/interfaces/unit';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

@Component({
  selector: 'app-units',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzTableModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NzMessageModule,
    NzBadgeModule
  ],
  templateUrl: './units.component.html',
  styleUrl: './units.component.scss'
})
export class UnitsComponent implements OnInit {
  units: UnitInterface[] = [];
  cmpUuid: string = ''; // Default company UUID for testing
  isLoading = false;

  // Modal control
  isModalVisible = false;
  modalTitle = 'Nueva Unidad';
  isEditing = false;
  currentUnitUuid: string | null = null;
  unitForm!: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private unitsService: UnitsService,
    private sessionService: SessionService,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    // Intentar obtener cmp_uuid de la sesión del usuario o local storage
    const session = this.sessionService.getCurrentSession();
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;
    this.loadUnits();
  }

  public initForm(): void {
    this.unitForm = this.fb.group({
      uni_code: ['', [Validators.required, Validators.minLength(2)]],
      uni_category: ['Residencial', [Validators.required]],
      uni_status: ['Activo', [Validators.required]],
      uni_financialcoefficient: [1.0000, [Validators.required, Validators.min(0)]],
      uni_baseamountcustom: [0.00, [Validators.required, Validators.min(0)]],
      uni_locationdetails: [''],
      uni_istransferable: [true]
    });
  }

  public loadUnits(): void {
    this.isLoading = true;
    this.unitsService.getUnits(this.cmpUuid).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        // El endpoint del controlador retorna { success: true, data: [...] } o paginado
        if (res.success) {
          this.units = res.data || [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.message.error('No se pudieron cargar las unidades del consorcio.');
      }
    });
  }

  public showCreateModal(): void {
    this.isEditing = false;
    this.modalTitle = 'Nueva Unidad';
    this.currentUnitUuid = null;
    this.unitForm.reset({
      uni_code: '',
      uni_category: 'Residencial',
      uni_status: 'Activo',
      uni_financialcoefficient: 1.0000,
      uni_baseamountcustom: 0.00,
      uni_locationdetails: '',
      uni_istransferable: true
    });
    this.isModalVisible = true;
  }

  public showEditModal(unit: UnitInterface): void {
    this.isEditing = true;
    this.modalTitle = 'Editar Unidad';
    this.currentUnitUuid = unit.uni_uuid;
    this.unitForm.patchValue({
      uni_code: unit.uni_code,
      uni_category: unit.uni_category,
      uni_status: unit.uni_status,
      uni_financialcoefficient: unit.uni_financialcoefficient,
      uni_baseamountcustom: unit.uni_baseamountcustom,
      uni_locationdetails: unit.uni_locationdetails,
      uni_istransferable: unit.uni_istransferable
    });
    this.isModalVisible = true;
  }

  public handleCancel(): void {
    this.isModalVisible = false;
  }

  public saveUnit(): void {
    if (this.unitForm.valid) {
      this.isSaving = true;
      const formValue = {
        ...this.unitForm.value,
        cmp_uuid: this.cmpUuid
      };

      if (this.isEditing && this.currentUnitUuid) {
        this.unitsService.updateUnit(this.cmpUuid, this.currentUnitUuid, formValue).subscribe({
          next: (res: any) => {
            this.isSaving = false;
            this.isModalVisible = false;
            this.message.success('Unidad actualizada con éxito');
            this.loadUnits();
          },
          error: (err: any) => {
            this.isSaving = false;
            console.error(err);
            this.message.error(err.error?.error || 'Error al actualizar la unidad');
          }
        });
      } else {
        this.unitsService.saveUnit(formValue).subscribe({
          next: (res: any) => {
            this.isSaving = false;
            this.isModalVisible = false;
            this.message.success('Unidad creada con éxito');
            this.loadUnits();
          },
          error: (err: any) => {
            this.isSaving = false;
            console.error(err);
            this.message.error(err.error?.error || 'Error al crear la unidad');
          }
        });
      }
    } else {
      Object.values(this.unitForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  public deleteUnit(unit: UnitInterface): void {
    if (!unit.uni_uuid) return;
    
    this.unitsService.deleteUnit(this.cmpUuid, unit.uni_uuid).subscribe({
      next: (res: any) => {
        this.message.success('Unidad eliminada con éxito');
        this.loadUnits();
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('No se pudo eliminar la unidad.');
      }
    });
  }

  public getBadgeStatus(status: string): 'success' | 'error' | 'warning' {
    switch (status) {
      case 'Activo':
        return 'success';
      case 'Inactivo':
        return 'error';
      case 'En_Mantenimiento':
        return 'warning';
      default:
        return 'warning';
    }
  }

  public formatStatus(status: string): string {
    if (status === 'En_Mantenimiento') {
      return 'En Mantenimiento';
    }
    return status;
  }
}
