import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { SitesService } from '../../core/services/sites.service';
import { SpacesService } from '../../core/services/spaces.service';
import { ReservationsService } from '../../core/services/reservations.service';
import { SessionService } from '../../core/services/session.service';
import { SiteInterface } from '../../core/interfaces/site';
import { SpaceInterface } from '../../core/interfaces/space';
import { ReservationInterface } from '../../core/interfaces/reservation';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

@Component({
  selector: 'app-spaces',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NzTableModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NzModalModule,
    NzFormModule,
    NzSelectModule,
    NzInputModule,
    NzInputNumberModule,
    NzMessageModule,
    NzPopconfirmModule
  ],
  templateUrl: './spaces.component.html',
  styleUrl: './spaces.component.scss'
})
export class SpacesComponent implements OnInit {
  activeSection: 'sites' | 'spaces' | 'reservations' = 'sites';

  // Data lists
  sites: SiteInterface[] = [];
  spaces: SpaceInterface[] = [];
  reservations: ReservationInterface[] = [];

  isLoading = false;
  isSaving = false;

  cmpUuid = '';
  usrUuid = '';

  // Modals visibility
  isSiteModalVisible = false;
  isSpaceModalVisible = false;

  // Forms
  siteForm!: FormGroup;
  spaceForm!: FormGroup;

  // Editing state
  editingSiteUuid: string | null = null;
  editingSpaceUuid: string | null = null;

  constructor(
    private fb: FormBuilder,
    private sitesService: SitesService,
    private spacesService: SpacesService,
    private reservationsService: ReservationsService,
    private sessionService: SessionService,
    private message: NzMessageService
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    // Trigger compiler reload to pick up ReservationInterface updates
    const session = this.sessionService.getCurrentSession();
    this.cmpUuid = session?.identity?.cmp_uuid || this.sessionService.getCompany()?.cmp_uuid;
    this.usrUuid = session?.identity?.usr_uuid || '';

    if (this.cmpUuid) {
      this.loadAllData();
    } else {
      this.message.warning('No se pudo identificar tu sesión administrativa.');
    }
  }

  public initForms(): void {
    this.siteForm = this.fb.group({
      sit_name: ['', [Validators.required, Validators.minLength(3)]],
      sit_address: ['', [Validators.required]],
      sit_status: ['Activo', [Validators.required]]
    });

    this.spaceForm = this.fb.group({
      sit_uuid: ['', [Validators.required]],
      spa_code: ['', [Validators.required, Validators.minLength(2)]],
      spa_name: ['', [Validators.required, Validators.minLength(3)]],
      spa_type: ['Reservable', [Validators.required]],
      spa_capacity: [null],
      spa_cost: [0.00, [Validators.min(0)]],
      spa_status: ['Active', [Validators.required]]
    });
  }

  public loadAllData(): void {
    this.loadSites();
    this.loadSpaces();
    this.loadReservations();
  }

  public loadSites(): void {
    this.isLoading = true;
    this.sitesService.getSites(this.cmpUuid).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success) {
          this.sites = res.data || [];
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  public loadSpaces(): void {
    this.spacesService.getSpaces(this.cmpUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.spaces = res.data || [];
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  public loadReservations(): void {
    this.reservationsService.getReservations(this.cmpUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.reservations = res.data || [];
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  public setSection(section: 'sites' | 'spaces' | 'reservations'): void {
    this.activeSection = section;
  }

  // --- SITE OPERATIONS ---
  public showCreateSiteModal(): void {
    this.editingSiteUuid = null;
    this.siteForm.reset({
      sit_name: '',
      sit_address: '',
      sit_status: 'Activo'
    });
    this.isSiteModalVisible = true;
  }

  public showEditSiteModal(site: any): void {
    this.editingSiteUuid = site.sit_uuid;
    this.siteForm.setValue({
      sit_name: site.sit_name,
      sit_address: site.sit_address,
      sit_status: site.sit_status || 'Activo'
    });
    this.isSiteModalVisible = true;
  }

  public saveSite(): void {
    if (this.siteForm.valid) {
      this.isSaving = true;
      const values = this.siteForm.value;

      if (this.editingSiteUuid) {
        // Update
        const payload = {
          cmp_uuid: this.cmpUuid,
          sit_uuid: this.editingSiteUuid,
          ...values
        };
        this.sitesService.updateSite(this.cmpUuid, this.editingSiteUuid, payload).subscribe({
          next: () => {
            this.isSaving = false;
            this.isSiteModalVisible = false;
            this.message.success('Sede actualizada con éxito');
            this.loadSites();
          },
          error: (err: any) => {
            this.isSaving = false;
            console.error(err);
            this.message.error('Ocurrió un error al actualizar la sede.');
          }
        });
      } else {
        // Insert
        const payload = {
          cmp_uuid: this.cmpUuid,
          sit_uuid: this.generateUUID(),
          ...values
        };
        this.sitesService.saveSite(payload).subscribe({
          next: () => {
            this.isSaving = false;
            this.isSiteModalVisible = false;
            this.message.success('Sede creada con éxito');
            this.loadSites();
          },
          error: (err: any) => {
            this.isSaving = false;
            console.error(err);
            this.message.error('Ocurrió un error al crear la sede.');
          }
        });
      }
    } else {
      Object.values(this.siteForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  public deleteSite(sitUuid: string | null): void {
    if (!sitUuid) {
      this.message.error('ID de sede inválido.');
      return;
    }
    this.sitesService.deleteSite(this.cmpUuid, sitUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success('Sede eliminada con éxito.');
          this.loadSites();
          this.loadSpaces(); // Deleting site might affect spaces list
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error(err.error?.error || 'No se pudo eliminar la sede.');
      }
    });
  }

  // --- SPACE OPERATIONS ---
  public showCreateSpaceModal(): void {
    this.editingSpaceUuid = null;
    this.spaceForm.reset({
      sit_uuid: this.sites.length > 0 ? this.sites[0].sit_uuid : '',
      spa_code: '',
      spa_name: '',
      spa_type: 'Reservable',
      spa_capacity: null,
      spa_cost: 0.00,
      spa_status: 'Active'
    });
    this.isSpaceModalVisible = true;
  }

  public showEditSpaceModal(space: any): void {
    this.editingSpaceUuid = space.spa_uuid;
    this.spaceForm.setValue({
      sit_uuid: space.sit_uuid,
      spa_code: space.spa_code || '',
      spa_name: space.spa_name,
      spa_type: space.spa_type || 'Reservable',
      spa_capacity: space.spa_capacity || null,
      spa_cost: space.spa_cost || 0.00,
      spa_status: space.spa_status || 'Active'
    });
    this.isSpaceModalVisible = true;
  }

  public saveSpace(): void {
    if (this.spaceForm.valid) {
      this.isSaving = true;
      const values = this.spaceForm.value;

      if (this.editingSpaceUuid) {
        // Update
        const payload = {
          cmp_uuid: this.cmpUuid,
          spa_uuid: this.editingSpaceUuid,
          ...values
        };
        this.spacesService.updateSpace(this.cmpUuid, values.sit_uuid, this.editingSpaceUuid, payload).subscribe({
          next: () => {
            this.isSaving = false;
            this.isSpaceModalVisible = false;
            this.message.success('Espacio actualizado con éxito');
            this.loadSpaces();
          },
          error: (err: any) => {
            this.isSaving = false;
            console.error(err);
            this.message.error('Ocurrió un error al actualizar el espacio.');
          }
        });
      } else {
        // Insert
        const payload = {
          cmp_uuid: this.cmpUuid,
          spa_uuid: this.generateUUID(),
          ...values
        };
        this.spacesService.saveSpace(payload).subscribe({
          next: () => {
            this.isSaving = false;
            this.isSpaceModalVisible = false;
            this.message.success('Espacio creado con éxito');
            this.loadSpaces();
          },
          error: (err: any) => {
            this.isSaving = false;
            console.error(err);
            this.message.error('Ocurrió un error al crear el espacio.');
          }
        });
      }
    } else {
      Object.values(this.spaceForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  public deleteSpace(spaUuid: string | null): void {
    if (!spaUuid) {
      this.message.error('ID de espacio inválido.');
      return;
    }
    const space = this.spaces.find(s => s.spa_uuid === spaUuid);
    if (!space) {
      this.message.error('No se pudo encontrar el espacio.');
      return;
    }
    this.spacesService.deleteSpace(this.cmpUuid, space.sit_uuid!, spaUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success('Espacio eliminado con éxito.');
          this.loadSpaces();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('No se pudo eliminar el espacio.');
      }
    });
  }

  // --- RESERVATION MODERATION ---
  public updateReservationStatus(resUuid: string | null, status: 'Aprobada' | 'Cancelada'): void {
    if (!resUuid) {
      this.message.error('ID de reserva inválido.');
      return;
    }
    const r = this.reservations.find(item => item.res_uuid === resUuid);
    if (!r || !r.cmp_uuid || !r.sit_uuid || !r.spa_uuid || !r.usr_uuid) {
      this.message.error('No se pudo encontrar la reserva.');
      return;
    }
    this.reservationsService.updateReservation(r.cmp_uuid, r.sit_uuid, r.spa_uuid, r.usr_uuid, resUuid, { res_status: status }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success(`Reserva marcada como ${status}.`);
          this.loadReservations();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('Ocurrió un error al actualizar el estado de la reserva.');
      }
    });
  }

  public deleteReservation(resUuid: string | null): void {
    if (!resUuid) {
      this.message.error('ID de reserva inválido.');
      return;
    }
    const r = this.reservations.find(item => item.res_uuid === resUuid);
    if (!r || !r.cmp_uuid || !r.sit_uuid || !r.spa_uuid || !r.usr_uuid) {
      this.message.error('No se pudo encontrar la reserva.');
      return;
    }
    this.reservationsService.deleteReservation(r.cmp_uuid, r.sit_uuid, r.spa_uuid, r.usr_uuid, resUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success('Reserva eliminada.');
          this.loadReservations();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('No se pudo eliminar la reserva.');
      }
    });
  }

  public getBadgeStatus(status: string): 'success' | 'warning' | 'error' | 'default' {
    switch (status) {
      case 'Aprobada':
        return 'success';
      case 'Pendiente':
        return 'warning';
      case 'Cancelada':
        return 'error';
      default:
        return 'default';
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
