import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';

import { UsersService } from '../../core/services/users.service';
import { SessionService } from '../../core/services/session.service';

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSkeletonModule,
    NzMessageModule
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.scss'
})
export class MyProfileComponent implements OnInit {
  isLoading = true;
  isSavingProfile = false;
  isSavingPassword = false;

  usrUuid = '';
  user: any = null;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  selectedImageBase64: string | null = null;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private sessionService: SessionService,
    private message: NzMessageService
  ) {
    this.initForms();
  }

  ngOnInit(): void {
    const session = this.sessionService.getCurrentSession();
    this.usrUuid = session?.identity?.usr_uuid || '';

    if (!this.usrUuid) {
      this.message.error('No se pudo identificar tu sesión.');
      this.isLoading = false;
      return;
    }

    this.loadUserProfile();
  }

  private initForms(): void {
    this.profileForm = this.fb.group({
      usr_name: ['', [Validators.required, Validators.maxLength(50)]],
      usr_surname: ['', [Validators.required, Validators.maxLength(50)]],
      usr_nick: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
      usr_email: ['', [Validators.required, Validators.email]],
      usr_bio: ['', [Validators.maxLength(250)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  private loadUserProfile(): void {
    this.isLoading = true;
    this.usersService.getUserById(this.usrUuid).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.success && res.data) {
          this.user = res.data;
          this.selectedImageBase64 = this.user.usr_image || null;
          
          this.profileForm.patchValue({
            usr_name: this.user.usr_name || '',
            usr_surname: this.user.usr_surname || '',
            usr_nick: this.user.usr_nick || '',
            usr_email: this.user.usr_email || '',
            usr_bio: this.user.usr_bio || ''
          });
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar datos del usuario:', err);
        this.message.error('No se pudieron recuperar los datos de tu cuenta.');
      }
    });
  }

  public onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      this.message.warning('La foto de perfil no debe superar los 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.selectedImageBase64 = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  public updateProfile(): void {
    if (this.profileForm.invalid) {
      this.message.warning('Por favor, completa los campos requeridos correctamente.');
      return;
    }

    this.isSavingProfile = true;
    const payload = {
      ...this.profileForm.value,
      usr_image: this.selectedImageBase64,
      // Retain other required user fields
      usr_sysadmin: this.user.usr_sysadmin,
      usr_online: this.user.usr_online,
      usr_socket: this.user.usr_socket,
      usr_registered: this.user.usr_registered
    };

    this.usersService.updateUser(this.usrUuid, payload).subscribe({
      next: (res: any) => {
        this.isSavingProfile = false;
        if (res.success) {
          this.message.success('Datos de perfil guardados correctamente.');
          this.user = res.data;
          // Update local session storage identity
          this.sessionService.setIdentity(res.data);
        }
      },
      error: (err) => {
        this.isSavingProfile = false;
        console.error('Error al guardar datos de perfil:', err);
        this.message.error('No se pudo guardar la información del perfil.');
      }
    });
  }

  public changePassword(): void {
    if (this.passwordForm.invalid) {
      this.message.warning('Completa todos los campos del formulario de seguridad.');
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    if (newPassword !== confirmPassword) {
      this.message.error('Las nuevas contraseñas no coinciden.');
      return;
    }

    this.isSavingPassword = true;

    // Verify current password silently using the login service
    const credentials = {
      usr_user: this.user.usr_nick,
      usr_password: currentPassword
    };

    this.usersService.login(credentials).subscribe({
      next: (resLogin: any) => {
        // Verification succeeded! Now update password in database
        const payload = {
          ...this.user,
          usr_password: newPassword
        };

        this.usersService.updateUser(this.usrUuid, payload).subscribe({
          next: (resUpdate: any) => {
            this.isSavingPassword = false;
            this.message.success('Contraseña actualizada con éxito.');
            this.passwordForm.reset();
          },
          error: (err) => {
            this.isSavingPassword = false;
            console.error('Error al actualizar contraseña:', err);
            this.message.error('Ocurrió un error al intentar cambiar la contraseña.');
          }
        });
      },
      error: (err) => {
        this.isSavingPassword = false;
        this.message.error('La contraseña actual ingresada es incorrecta.');
      }
    });
  }

  public getInitials(): string {
    if (!this.user) return 'U';
    const first = this.user.usr_name ? this.user.usr_name[0] : '';
    const last = this.user.usr_surname ? this.user.usr_surname[0] : '';
    return (first + last).toUpperCase();
  }
}
