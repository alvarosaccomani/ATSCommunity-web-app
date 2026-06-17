import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UnitsService } from '../../core/services/units.service';
import { SessionService } from '../../core/services/session.service';
import { UserUnitsService } from '../../core/services/user-units.service';
import { UsersService } from '../../core/services/users.service';
import { SitesService } from '../../core/services/sites.service';
import { SpacesService } from '../../core/services/spaces.service';
import { SiteInterface } from '../../core/interfaces/site';
import { SpaceInterface } from '../../core/interfaces/space';
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
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

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
    NzBadgeModule,
    NzPopconfirmModule,
    NzDatePickerModule
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

  // Modal control de habitantes
  isAssignModalVisible = false;
  selectedUnit: UnitInterface | null = null;
  unitAssignments: any[] = [];
  usersList: any[] = [];
  isAssignmentsLoading = false;
  isAssigning = false;
  assignmentForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private unitsService: UnitsService,
    private sessionService: SessionService,
    private message: NzMessageService,
    private userUnitsService: UserUnitsService,
    private usersService: UsersService,
    private sitesService: SitesService,
    private spacesService: SpacesService,
    private http: HttpClient
  ) {
    this.initForm();
    this.initAssignmentForm();
  }

  sites: SiteInterface[] = [];
  spaces: SpaceInterface[] = [];

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;
    this.loadUnits();
    this.loadSites();
  }

  public initForm(): void {
    this.unitForm = this.fb.group({
      uni_code: ['', [Validators.required, Validators.minLength(2)]],
      uni_category: ['Residencial', [Validators.required]],
      uni_status: ['Activo', [Validators.required]],
      uni_financialcoefficient: [1.0000, [Validators.required, Validators.min(0)]],
      uni_baseamountcustom: [0.00, [Validators.required, Validators.min(0)]],
      uni_locationdetails: [''],
      sit_uuid: [''],
      spa_uuid: [''],
      uni_istransferable: [true]
    });

    // Escuchar cambios de sede para cargar espacios
    this.unitForm.get('sit_uuid')?.valueChanges.subscribe(sitUuid => {
      this.unitForm.get('spa_uuid')?.setValue('');
      if (sitUuid) {
        this.loadSpacesForSite(sitUuid);
      } else {
        this.spaces = [];
      }
    });
  }

  public loadSites(): void {
    this.sitesService.getSites(this.cmpUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.sites = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Error al cargar sedes:', err);
      }
    });
  }

  public loadSpacesForSite(sitUuid: string): void {
    this.spacesService.getSpacesBySite(this.cmpUuid, sitUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.spaces = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Error al cargar espacios:', err);
      }
    });
  }

  public initAssignmentForm(): void {
    this.assignmentForm = this.fb.group({
      usr_uuid: ['', [Validators.required]],
      usruni_relationtype: ['Inquilino', [Validators.required]],
      usruni_startdate: [new Date(), [Validators.required]],
      usruni_isactive: [true]
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
      sit_uuid: '',
      spa_uuid: '',
      uni_istransferable: true
    });
    this.isModalVisible = true;
  }

  public showEditModal(unit: UnitInterface): void {
    this.isEditing = true;
    this.modalTitle = 'Editar Unidad';
    this.currentUnitUuid = unit.uni_uuid;

    if (unit.sit_uuid) {
      this.loadSpacesForSite(unit.sit_uuid);
    } else {
      this.spaces = [];
    }

    this.unitForm.patchValue({
      uni_code: unit.uni_code,
      uni_category: unit.uni_category,
      uni_status: unit.uni_status,
      uni_financialcoefficient: unit.uni_financialcoefficient,
      uni_baseamountcustom: unit.uni_baseamountcustom,
      uni_locationdetails: unit.uni_locationdetails,
      sit_uuid: unit.sit_uuid || '',
      spa_uuid: unit.spa_uuid || '',
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

  public showAssignmentsModal(unit: UnitInterface): void {
    this.selectedUnit = unit;
    this.isAssignModalVisible = true;
    this.assignmentForm.reset({
      usr_uuid: '',
      usruni_relationtype: 'Inquilino',
      usruni_startdate: new Date(),
      usruni_isactive: true
    });
    this.loadUnitAssignments();
    this.loadUsersList();
  }

  public loadUnitAssignments(): void {
    if (!this.selectedUnit?.uni_uuid) return;
    this.isAssignmentsLoading = true;
    this.userUnitsService.getUnitUsers(this.cmpUuid, this.selectedUnit.uni_uuid).subscribe({
      next: (res: any) => {
        this.isAssignmentsLoading = false;
        if (res.success) {
          this.unitAssignments = res.data || [];
        }
      },
      error: (err: any) => {
        this.isAssignmentsLoading = false;
        console.error(err);
        this.message.error('No se pudieron cargar los habitantes asignados.');
      }
    });
  }

  public loadUsersList(): void {
    const session = this.sessionService.getCurrentSession();
    const token = session?.token;
    let headers = new HttpHeaders().set('content-type', 'application/json');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    this.http.get<any>(`${environment.apiUrl}users/all/1/100`, { headers }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.usersList = res.data || [];
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('No se pudo cargar la lista de usuarios.');
      }
    });
  }

  public createAssignment(): void {
    if (this.assignmentForm.valid && this.selectedUnit?.uni_uuid) {
      this.isAssigning = true;
      const formValue = this.assignmentForm.value;
      const payload = {
        cmp_uuid: this.cmpUuid,
        uni_uuid: this.selectedUnit.uni_uuid,
        usr_uuid: formValue.usr_uuid,
        usruni_relationtype: formValue.usruni_relationtype,
        usruni_startdate: formValue.usruni_startdate,
        usruni_isactive: formValue.usruni_isactive
      };

      this.userUnitsService.saveUserUnit(payload).subscribe({
        next: (res: any) => {
          this.isAssigning = false;
          if (res.success) {
            this.message.success('Asignación creada con éxito');
            this.loadUnitAssignments();
            // Reset state
            this.assignmentForm.get('usr_uuid')?.reset('');
          }
        },
        error: (err: any) => {
          this.isAssigning = false;
          console.error(err);
          this.message.error(err.error?.error || 'Error al crear la asignación.');
        }
      });
    } else {
      Object.values(this.assignmentForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  public deleteAssignment(assignment: any): void {
    if (!this.selectedUnit?.uni_uuid || !assignment.usr_uuid) return;
    this.userUnitsService.deleteUserUnit(this.cmpUuid, assignment.usr_uuid, this.selectedUnit.uni_uuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success('Asignación eliminada con éxito');
          this.loadUnitAssignments();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('No se pudo eliminar la asignación.');
      }
    });
  }

  public toggleAssignmentStatus(assignment: any): void {
    if (!this.selectedUnit?.uni_uuid || !assignment.usr_uuid) return;
    const updatedStatus = !assignment.usruni_isactive;
    const payload = {
      usruni_relationtype: assignment.usruni_relationtype,
      usruni_isactive: updatedStatus,
      usruni_startdate: assignment.usruni_startdate,
      usruni_enddate: updatedStatus ? null : new Date()
    };

    this.userUnitsService.updateUserUnit(this.cmpUuid, assignment.usr_uuid, this.selectedUnit.uni_uuid, payload).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success(`Asignación ${updatedStatus ? 'activada' : 'desactivada'} con éxito`);
          this.loadUnitAssignments();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('No se pudo actualizar el estado de la asignación.');
      }
    });
  }
}
