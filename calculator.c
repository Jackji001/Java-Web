#include <windows.h>
#include <stdio.h>
#include <stdlib.h>

#define ID_0 0
#define ID_1 1
#define ID_2 2
#define ID_3 3
#define ID_4 4
#define ID_5 5
#define ID_6 6
#define ID_7 7
#define ID_8 8
#define ID_9 9
#define ID_ADD 10
#define ID_SUBTRACT 11
#define ID_MULTIPLY 12
#define ID_DIVIDE 13
#define ID_EQUAL 14
#define ID_CLEAR 15
#define ID_DECIMAL 16
#define ID_LEFT_PAREN 17
#define ID_RIGHT_PAREN 18
#define ID_PERCENT 19

#define BUTTON_WIDTH 50
#define BUTTON_HEIGHT 40
#define DISPLAY_WIDTH 210
#define DISPLAY_HEIGHT 30

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);

char g_operator = '\0';
double g_first_operand = 0;
int g_waiting_for_second_operand = 0;
char g_display_text[256] = "";

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow)
{
    WNDCLASS wc = {0};
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "CalculatorClass";
    RegisterClass(&wc);

    HWND hwnd = CreateWindowEx(
        0,
        "CalculatorClass",
        "Calculator",
        WS_SYSMENU | WS_MINIMIZEBOX,
        CW_USEDEFAULT, CW_USEDEFAULT,
        240, 380,
        NULL, NULL, hInstance, NULL
    );

    ShowWindow(hwnd, nCmdShow);
    UpdateWindow(hwnd);

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0) > 0) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    return msg.wParam;
}

void AppendToDisplay(HWND hwnd, const char *text)
{
    if (strlen(g_display_text) < 200) {
        strcat(g_display_text, text);
        SetWindowText(hwnd, g_display_text);
    }
}

void SetDisplay(HWND hwnd, const char *text)
{
    strncpy(g_display_text, text, 255);
    g_display_text[255] = '\0';
    SetWindowText(hwnd, g_display_text);
}

void ClearDisplay(HWND hwnd)
{
    g_display_text[0] = '\0';
    g_operator = '\0';
    g_first_operand = 0;
    g_waiting_for_second_operand = 0;
    SetWindowText(hwnd, "");
}

double Calculate(double a, double b, char op)
{
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b != 0 ? a / b : 0;
        default: return b;
    }
}

void CalculateResult(HWND hwnd)
{
    if (g_operator != '\0' && g_waiting_for_second_operand) {
        double second_operand = atof(g_display_text);
        double result = Calculate(g_first_operand, second_operand, g_operator);

        char result_str[256];
        if (result == (int)result) {
            sprintf(result_str, "%.0f", result);
        } else {
            sprintf(result_str, "%.2f", result);
        }

        SetDisplay(hwnd, result_str);
        g_first_operand = result;
        g_operator = '\0';
        g_waiting_for_second_operand = 0;
    }
}

void CreateButton(HWND hwnd, HINSTANCE hInstance, const char *text, int x, int y, int id)
{
    CreateWindow(
        "BUTTON", text,
        WS_TABSTOP | WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON,
        x, y, BUTTON_WIDTH, BUTTON_HEIGHT,
        hwnd, (HMENU)id, hInstance, NULL
    );
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
    static HWND hDisplay;
    static HINSTANCE hInst;

    switch (uMsg) {
        case WM_CREATE: {
            hInst = ((LPCREATESTRUCT)lParam)->hInstance;

            hDisplay = CreateWindow(
                "EDIT", "",
                WS_CHILD | WS_VISIBLE | ES_RIGHT | ES_READONLY | WS_BORDER,
                10, 10, DISPLAY_WIDTH, DISPLAY_HEIGHT,
                hwnd, NULL, hInst, NULL
            );

            int btn_x[] = {10, 65, 120, 175};
            int btn_y[] = {50, 95, 140, 185, 230, 275};

            CreateButton(hwnd, hInst, "C", btn_x[0], btn_y[0], ID_CLEAR);
            CreateButton(hwnd, hInst, "/", btn_x[1], btn_y[0], ID_DIVIDE);
            CreateButton(hwnd, hInst, "*", btn_x[2], btn_y[0], ID_MULTIPLY);
            CreateButton(hwnd, hInst, "-", btn_x[3], btn_y[0], ID_SUBTRACT);

            CreateButton(hwnd, hInst, "7", btn_x[0], btn_y[1], ID_7);
            CreateButton(hwnd, hInst, "8", btn_x[1], btn_y[1], ID_8);
            CreateButton(hwnd, hInst, "9", btn_x[2], btn_y[1], ID_9);
            CreateButton(hwnd, hInst, "+", btn_x[3], btn_y[1], ID_ADD);

            CreateButton(hwnd, hInst, "4", btn_x[0], btn_y[2], ID_4);
            CreateButton(hwnd, hInst, "5", btn_x[1], btn_y[2], ID_5);
            CreateButton(hwnd, hInst, "6", btn_x[2], btn_y[2], ID_6);

            CreateButton(hwnd, hInst, "1", btn_x[0], btn_y[3], ID_1);
            CreateButton(hwnd, hInst, "2", btn_x[1], btn_y[3], ID_2);
            CreateButton(hwnd, hInst, "3", btn_x[2], btn_y[3], ID_3);
            CreateButton(hwnd, hInst, "=", btn_x[3], btn_y[3], ID_EQUAL);

            CreateButton(hwnd, hInst, "0", btn_x[0], btn_y[4], ID_0);
            CreateButton(hwnd, hInst, ".", btn_x[1], btn_y[4], ID_DECIMAL);

            CreateButton(hwnd, hInst, "(", btn_x[0], btn_y[5], ID_LEFT_PAREN);
            CreateButton(hwnd, hInst, ")", btn_x[1], btn_y[5], ID_RIGHT_PAREN);
            CreateButton(hwnd, hInst, "%", btn_x[2], btn_y[5], ID_PERCENT);

            break;
        }

        case WM_COMMAND: {
            int id = LOWORD(wParam);

            if (id >= ID_0 && id <= ID_9) {
                char num[2] = {'0' + (id - ID_0), '\0'};
                if (g_waiting_for_second_operand) {
                    SetDisplay(hDisplay, num);
                    g_waiting_for_second_operand = 0;
                } else {
                    AppendToDisplay(hDisplay, num);
                }
            }
            else if (id == ID_DECIMAL) {
                if (g_waiting_for_second_operand) {
                    SetDisplay(hDisplay, "0.");
                    g_waiting_for_second_operand = 0;
                } else if (!strchr(g_display_text, '.')) {
                    AppendToDisplay(hDisplay, ".");
                }
            }
            else if (id == ID_ADD || id == ID_SUBTRACT || id == ID_MULTIPLY || id == ID_DIVIDE) {
                if (g_operator != '\0' && g_waiting_for_second_operand) {
                    CalculateResult(hDisplay);
                }
                g_first_operand = atof(g_display_text);
                g_operator = (id == ID_ADD) ? '+' :
                            (id == ID_SUBTRACT) ? '-' :
                            (id == ID_MULTIPLY) ? '*' : '/';
                g_waiting_for_second_operand = 1;
            }
            else if (id == ID_EQUAL) {
                CalculateResult(hDisplay);
                g_operator = '\0';
            }
            else if (id == ID_CLEAR) {
                ClearDisplay(hDisplay);
            }
            else if (id == ID_PERCENT) {
                double val = atof(g_display_text);
                val = val / 100;
                char val_str[256];
                sprintf(val_str, "%.2f", val);
                SetDisplay(hDisplay, val_str);
            }
            break;
        }

        case WM_DESTROY:
            PostQuitMessage(0);
            return 0;
    }

    return DefWindowProc(hwnd, uMsg, wParam, lParam);
}