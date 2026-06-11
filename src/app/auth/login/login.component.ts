import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsersService } from '../../core/services/users.service';
import { SessionService } from '../../core/services/session.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageModule, NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzMessageModule,
    NzIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private _sessionService: SessionService,
    private router: Router,
    private message: NzMessageService
  ) {
    this.initForm();
  }

  public initForm(): void {
    this.loginForm = this.fb.group({
      usr_user: ['', [Validators.required, Validators.minLength(3)]],
      usr_password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [true]
    });
  }

  public submitForm(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      const { usr_user, usr_password } = this.loginForm.value;

      // Llamamos al método login pasando el objeto y 'true' para obtener el token JWT
      this.usersService.login({ usr_user, usr_password }, 'true').subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success && res.data && res.data.token) {
            this.message.success('Inicio de sesión exitoso');
            // Guardamos el token e identidad usando SessionService
            this._sessionService.setToken(res.data.token);
            if (res.data.user) {
              this._sessionService.setIdentity(res.data.user);
            } else {
              this._sessionService.setIdentity(res.data);
            }
            // Redirigir a welcome
            this.router.navigate(['/welcome']);
          } else {
            this.message.error(res.message || 'Error desconocido al iniciar sesión');
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error(err);
          const errMsg = err.error?.error || err.error?.message || 'Error de conexión con el servidor';
          this.message.error(errMsg);
        }
      });
    } else {
      Object.values(this.loginForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
