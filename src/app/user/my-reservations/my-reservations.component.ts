import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ReservationsService } from '../../core/services/reservations.service';
import { SitesService } from '../../core/services/sites.service';
import { SpacesService } from '../../core/services/spaces.service';
import { SessionService } from '../../core/services/session.service';
import { SiteInterface } from '../../core/interfaces/site';
import { SpaceInterface } from '../../core/interfaces/space';
import { ReservationInterface } from '../../core/interfaces/reservation';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';

@Component({
  selector: 'app-my-reservations',
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
    NzSelectModule,
    NzDatePickerModule,
    NzMessageModule,
    NzPopconfirmModule
  ],
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.scss'
})
export class MyReservationsComponent implements OnInit {
  reservations: ReservationInterface[] = [];
  filteredReservations: ReservationInterface[] = [];
  sites: SiteInterface[] = [];
  spaces: SpaceInterface[] = [];
  isLoading = false;
  isSaving = false;

  activeTab: 'upcoming' | 'past' = 'upcoming';

  // Modal
  isModalVisible = false;
  reservationForm!: FormGroup;

  // Selected space details
  selectedSpaceDetail: any = null;

  cmpUuid = '';
  usrUuid = '';

  slots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '12:00 - 14:00',
    '14:00 - 16:00',
    '16:00 - 18:00',
    '18:00 - 20:00',
    '20:00 - 22:00',
    '22:00 - 00:00'
  ];

  disabledDate = (current: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return current < today;
  };

  public isSlotDisabled(slot: string): boolean {
    const selectedDate = this.reservationForm.get('res_date')?.value;
    if (!selectedDate) {
      return false;
    }

    const today = new Date();
    const selDateObj = new Date(selectedDate);

    const isToday = selDateObj.getFullYear() === today.getFullYear() &&
                    selDateObj.getMonth() === today.getMonth() &&
                    selDateObj.getDate() === today.getDate();

    if (!isToday) {
      return false;
    }

    const startTimeStr = slot.split(' - ')[0];
    const [startHour, startMin] = startTimeStr.split(':').map(Number);

    const currentHour = today.getHours();
    const currentMin = today.getMinutes();

    if (currentHour > startHour) {
      return true;
    } else if (currentHour === startHour) {
      return currentMin >= startMin;
    }

    return false;
  }

  constructor(
    private fb: FormBuilder,
    private reservationsService: ReservationsService,
    private sitesService: SitesService,
    private spacesService: SpacesService,
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
      this.loadReservations();
      this.loadSites();
    } else {
      this.message.warning('No se pudo identificar tu sesión.');
    }
  }

  public initForm(): void {
    this.reservationForm = this.fb.group({
      sit_uuid: ['', [Validators.required]],
      spa_uuid: ['', [Validators.required]],
      res_date: [null, [Validators.required]],
      res_slot: ['', [Validators.required]]
    });

    // Listen to site changes to filter spaces
    this.reservationForm.get('sit_uuid')?.valueChanges.subscribe(sitUuid => {
      this.reservationForm.get('spa_uuid')?.setValue('');
      this.selectedSpaceDetail = null;
      if (sitUuid) {
        this.loadSpaces(sitUuid);
      } else {
        this.spaces = [];
      }
    });

    // Listen to space changes to show capacity/cost
    this.reservationForm.get('spa_uuid')?.valueChanges.subscribe(spaUuid => {
      if (spaUuid) {
        this.selectedSpaceDetail = this.spaces.find(s => s.spa_uuid === spaUuid) || null;
      } else {
        this.selectedSpaceDetail = null;
      }
    });

    // Listen to date changes to reset slot if it becomes disabled
    this.reservationForm.get('res_date')?.valueChanges.subscribe(date => {
      const slotControl = this.reservationForm.get('res_slot');
      const currentSlot = slotControl?.value;
      if (date && currentSlot && this.isSlotDisabled(currentSlot)) {
        slotControl?.setValue('');
      }
    });
  }

  public loadReservations(): void {
    this.isLoading = true;
    this.reservationsService.getReservationsByUser(this.cmpUuid, this.usrUuid).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.reservations = res.data || [];
        this.filterReservations();
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error(err);
        this.message.error('No se pudieron cargar tus reservas.');
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
        console.error(err);
      }
    });
  }

  public loadSpaces(sitUuid: string): void {
    this.spacesService.getSpacesBySite(this.cmpUuid, sitUuid).subscribe({
      next: (res: any) => {
        if (res.success) {
          // Filtrar para mostrar sólo espacios Reservables y Activos
          this.spaces = (res.data || []).filter(
            (s: any) => s.spa_type === 'Reservable' && s.spa_status === 'Active'
          );
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  public filterReservations(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    if (this.activeTab === 'upcoming') {
      this.filteredReservations = this.reservations.filter(r => {
        if (!r.res_date) return false;
        const resDateStr = r.res_date instanceof Date 
          ? r.res_date.toISOString().split('T')[0] 
          : String(r.res_date);
        const isFutureOrToday = resDateStr >= todayStr;
        return isFutureOrToday && r.res_status !== 'Cancelada';
      });
    } else {
      this.filteredReservations = this.reservations.filter(r => {
        if (!r.res_date) return true;
        const resDateStr = r.res_date instanceof Date 
          ? r.res_date.toISOString().split('T')[0] 
          : String(r.res_date);
        const isPast = resDateStr < todayStr;
        return isPast || r.res_status === 'Cancelada';
      });
    }
  }

  public setTab(tab: 'upcoming' | 'past'): void {
    this.activeTab = tab;
    this.filterReservations();
  }

  public showCreateModal(): void {
    this.reservationForm.reset({
      sit_uuid: '',
      spa_uuid: '',
      res_date: null,
      res_slot: ''
    });
    this.selectedSpaceDetail = null;
    this.isModalVisible = true;
  }

  public handleCancel(): void {
    this.isModalVisible = false;
  }

  public saveReservation(): void {
    if (this.reservationForm.valid) {
      this.isSaving = true;
      const formValue = this.reservationForm.value;

      // Format date to YYYY-MM-DD
      const dateObj = new Date(formValue.res_date);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      const payload = {
        cmp_uuid: this.cmpUuid,
        sit_uuid: formValue.sit_uuid,
        res_uuid: this.generateUUID(),
        spa_uuid: formValue.spa_uuid,
        usr_uuid: this.usrUuid,
        res_date: formattedDate,
        res_slot: formValue.res_slot,
        res_status: 'Pendiente' // Defaults to Pendiente, admin can approve/reject
      };

      this.reservationsService.saveReservation(payload).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res.success) {
            this.message.success('Reserva creada con éxito. Pendiente de aprobación.');
            this.isModalVisible = false;
            this.loadReservations();
          } else {
            this.message.error(res.message || 'No se pudo crear la reserva.');
          }
        },
        error: (err: any) => {
          this.isSaving = false;
          console.error(err);
          this.message.error(err.error?.error || 'Error al solicitar la reserva. Es posible que el horario ya esté ocupado.');
        }
      });
    } else {
      Object.values(this.reservationForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  public cancelReservation(resUuid: string | null): void {
    if (!resUuid) {
      this.message.error('ID de reserva inválido.');
      return;
    }
    const r = this.reservations.find(item => item.res_uuid === resUuid);
    if (!r || !r.cmp_uuid || !r.sit_uuid || !r.spa_uuid || !r.usr_uuid) {
      this.message.error('No se pudo encontrar la reserva.');
      return;
    }
    this.reservationsService.updateReservation(r.cmp_uuid, r.sit_uuid, r.spa_uuid, r.usr_uuid, resUuid, { res_status: 'Cancelada' }).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.message.success('Reserva cancelada con éxito.');
          this.loadReservations();
        }
      },
      error: (err: any) => {
        console.error(err);
        this.message.error('No se pudo cancelar la reserva.');
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
