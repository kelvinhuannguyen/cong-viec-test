import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthError } from '../../data/auth';
import { createFakeAuth, testUser } from '../../test/fakeAuth';
import { AuthGate } from './AuthGate';
import { authErrorMessage, AUTH_FALLBACK, consumeUrlAuthError } from './authErrors';
import { LoginPage } from './LoginPage';

describe('authErrorMessage', () => {
  it('dịch mã lỗi Supabase sang tiếng Việt', () => {
    expect(authErrorMessage(new AuthError('invalid_credentials'))).toBe('Email hoặc mật khẩu không đúng.');
    expect(authErrorMessage(new AuthError('network'))).toMatch(/Không kết nối được/);
    expect(authErrorMessage(new AuthError('la_lam'))).toBe(AUTH_FALLBACK);
    expect(authErrorMessage(new Error('x'))).toBe(AUTH_FALLBACK);
  });
});

describe('LoginPage', () => {
  it('đăng nhập bằng email + mật khẩu (email được trim)', async () => {
    const user = userEvent.setup();
    const { auth } = createFakeAuth();
    render(<LoginPage auth={auth} />);
    await user.type(screen.getByLabelText('Email'), '  lan.tran@vidu.com ');
    await user.type(screen.getByLabelText('Mật khẩu'), 'matkhau123');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(auth.signIn).toHaveBeenCalledWith('lan.tran@vidu.com', 'matkhau123');
  });

  it('sai mật khẩu thì hiện lỗi tiếng Việt', async () => {
    const user = userEvent.setup();
    const { auth } = createFakeAuth();
    vi.mocked(auth.signIn).mockRejectedValueOnce(new AuthError('invalid_credentials'));
    render(<LoginPage auth={auth} />);
    await user.type(screen.getByLabelText('Email'), 'lan.tran@vidu.com');
    await user.type(screen.getByLabelText('Mật khẩu'), 'sai');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng.');
  });

  it('tạo tài khoản: chặn mật khẩu ngắn, xong thì báo kiểm tra email', async () => {
    const user = userEvent.setup();
    const { auth } = createFakeAuth();
    render(<LoginPage auth={auth} />);
    await user.click(screen.getByRole('tab', { name: 'Tạo tài khoản' }));
    await user.type(screen.getByLabelText('Email'), 'lan.tran@vidu.com');
    await user.type(screen.getByLabelText('Mật khẩu'), 'ngan');
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu cần ít nhất 8 ký tự.');
    expect(auth.signUp).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Mật khẩu'), 'dumuoi12');
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }));
    expect(auth.signUp).toHaveBeenCalledWith('lan.tran@vidu.com', 'ngandumuoi12');
    expect(await screen.findByRole('status')).toHaveTextContent('Đã gửi email xác nhận tới lan.tran@vidu.com');
  });

  it('quên mật khẩu gửi email đặt lại', async () => {
    const user = userEvent.setup();
    const { auth } = createFakeAuth();
    render(<LoginPage auth={auth} />);
    await user.click(screen.getByRole('button', { name: 'Quên mật khẩu?' }));
    await user.type(screen.getByLabelText('Email'), 'lan.tran@vidu.com');
    await user.click(screen.getByRole('button', { name: 'Gửi link đặt lại' }));
    expect(auth.sendPasswordReset).toHaveBeenCalledWith('lan.tran@vidu.com');
    expect(await screen.findByRole('status')).toHaveTextContent('link đặt lại mật khẩu đã được gửi');
  });

  it('nút Google gọi đăng nhập Google', async () => {
    const user = userEvent.setup();
    const { auth } = createFakeAuth();
    render(<LoginPage auth={auth} />);
    await user.click(screen.getByRole('button', { name: 'Tiếp tục với Google' }));
    expect(auth.signInWithGoogle).toHaveBeenCalled();
  });
});

describe('AuthGate', () => {
  it('chưa đăng nhập thì hiện màn hình đăng nhập, đăng nhập xong thì vào app, đăng xuất thì quay lại', async () => {
    const user = userEvent.setup();
    const { auth, emit } = createFakeAuth();
    render(
      <AuthGate auth={auth}>
        {(session) => (
          <div>
            <p>Xin chào {session.user.email}</p>
            <button type="button" onClick={() => void session.signOut()}>
              Thoát
            </button>
          </div>
        )}
      </AuthGate>,
    );
    expect(await screen.findByRole('heading', { name: 'Chào mừng trở lại' })).toBeInTheDocument();
    act(() => emit('SIGNED_IN', testUser));
    expect(await screen.findByText('Xin chào lan.tran@vidu.com')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Thoát' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeInTheDocument());
  });

  it('có phiên sẵn thì vào thẳng app', async () => {
    const { auth } = createFakeAuth(testUser);
    render(<AuthGate auth={auth}>{(session) => <p>Xin chào {session.user.name}</p>}</AuthGate>);
    expect(await screen.findByText('Xin chào Trần Ngọc Lan')).toBeInTheDocument();
  });

  it('link đặt lại mật khẩu mở trang đặt mật khẩu mới', async () => {
    const user = userEvent.setup();
    const { auth, emit } = createFakeAuth();
    render(<AuthGate auth={auth}>{() => <p>Trong app</p>}</AuthGate>);
    await screen.findByRole('heading', { name: 'Chào mừng trở lại' });
    act(() => emit('PASSWORD_RECOVERY', testUser));
    expect(await screen.findByRole('heading', { name: 'Đặt mật khẩu mới' })).toBeInTheDocument();
    await user.type(screen.getByLabelText('Mật khẩu mới'), 'matkhaumoi1');
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'matkhaumoi2');
    await user.click(screen.getByRole('button', { name: 'Lưu mật khẩu mới' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Hai mật khẩu chưa khớp nhau.');
    await user.clear(screen.getByLabelText('Nhập lại mật khẩu mới'));
    await user.type(screen.getByLabelText('Nhập lại mật khẩu mới'), 'matkhaumoi1');
    await user.click(screen.getByRole('button', { name: 'Lưu mật khẩu mới' }));
    expect(auth.updatePassword).toHaveBeenCalledWith('matkhaumoi1');
    expect(await screen.findByText('Trong app')).toBeInTheDocument();
  });
});

describe('consumeUrlAuthError', () => {
  it('đọc lỗi trên địa chỉ trang, dịch sang tiếng Việt và xoá khỏi địa chỉ', () => {
    window.history.replaceState(null, '', '/#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid');
    expect(consumeUrlAuthError()).toBe('Link trong email đã hết hạn hoặc đã được dùng. Hãy yêu cầu link mới.');
    expect(window.location.hash).toBe('');
    expect(consumeUrlAuthError()).toBeNull();
  });

  it('LoginPage hiện lỗi từ link email ngay khi mở', () => {
    window.history.replaceState(null, '', '/?error=access_denied&error_code=otp_expired');
    const { auth } = createFakeAuth();
    render(<LoginPage auth={auth} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Link trong email đã hết hạn');
    expect(window.location.search).toBe('');
  });
});
