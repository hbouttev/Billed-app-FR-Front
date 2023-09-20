/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import  { fireEvent, screen, waitFor } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import NewBillUI from '../views/NewBillUI.js'
import NewBill from '../containers/NewBill.js'
import { bills } from '../fixtures/bills.js'
import { ROUTES_PATH } from '../constants/routes.js'
import { localStorageMock } from '../__mocks__/localStorage.js'
import mockStore from '../__mocks__/store.js'
import router from '../app/Router.js'

jest.mock('../app/Store', () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then new bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon).toHaveClass('active-icon')
    })

    test("Then new bill form should be displayed", () => {
      document.body.innerHTML = NewBillUI()
      const newBillForm = screen.getByTestId('form-new-bill')
      expect(newBillForm).toBeTruthy()
    })
  })
})

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBills Page and I choose a proof file with supported file type', () => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement('div')
    root.setAttribute('id', 'root')
    document.body.innerHTML = ''
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.NewBill)

    const newBill= new NewBill({
      document, onNavigate, store: mockStore, bills: bills, localStorage: window.localStorage
    })
    const spyHandleChangeFile = jest.spyOn(newBill, 'handleChangeFile')
    const fileInput = screen.getByTestId('file')

    fileInput.addEventListener('change', newBill.handleChangeFile)
    const file = new File(['TestFile'], 'test.jpg', {type: 'image/jpeg'})
    userEvent.upload(fileInput, file)

    test('Then file input should contain the file', async () => {
      expect(spyHandleChangeFile).toHaveBeenCalled()
      expect(fileInput.files[0]).toStrictEqual(file)
      expect(fileInput.files).toHaveLength(1)
    })

    test('Then it should store the file', async () => {
      await new Promise(process.nextTick)
      expect(newBill.fileName).toEqual('test.jpg')
      expect(newBill.fileUrl).toEqual('https://localhost:3456/images/test.jpg')
      expect(newBill.billId).toEqual('1234')
    })
  })

  describe('When I am on NewBills Page and I choose a proof file with unsupported file type', () => {
    test('Then it should not store the file', async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement('div')
      root.setAttribute('id', 'root')
      document.body.innerHTML = ''
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)

      const newBill= new NewBill({
        document, onNavigate, store: mockStore, bills: bills, localStorage: window.localStorage
      })
      const spyHandleChangeFile = jest.spyOn(newBill, 'handleChangeFile')
      const fileInput = screen.getByTestId('file')

      fileInput.addEventListener('change', newBill.handleChangeFile)
      const file = new File(['TestFile'], 'test.pdf', {type: 'application/pdf'})
      userEvent.upload(fileInput, file)

      expect(spyHandleChangeFile).toHaveBeenCalled()
      await new Promise(process.nextTick)
      expect(newBill.fileName).toBeFalsy()
      expect(newBill.fileUrl).toBeFalsy()
      expect(newBill.billId).toBeFalsy()
    })
  })

  describe('When I am on NewBills Page and I fill and submit the form', () => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
    const root = document.createElement('div')
    root.setAttribute('id', 'root')
    document.body.innerHTML = ''
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.NewBill)

    const newBill= new NewBill({
      document, onNavigate, store: mockStore, bills: bills, localStorage: window.localStorage
    })
    const spyHandleSubmit = jest.spyOn(newBill, 'handleSubmit')
    const newBillForm = screen.getByTestId('form-new-bill')
    newBillForm.addEventListener('submit', newBill.handleSubmit)

    test('Then the form is filled', async () => {
      const fileInput = screen.getByTestId('file')
      const file = new File(['TestFile'], 'test.jpg', {type: 'image/jpeg'})
      userEvent.upload(fileInput, file)
      expect(fileInput.files[0]).toStrictEqual(file)

      const selectExpenseType = screen.getByTestId('expense-type')
      await userEvent.selectOptions(selectExpenseType, 'Transports')
      expect(screen.getByText('Transports').selected).toBe(true)

      const inputExpenseName = screen.getByTestId('expense-name')
      await userEvent.type(inputExpenseName, 'Test name')
      expect(inputExpenseName).toHaveValue('Test name')

      const inputDatepicker = screen.getByTestId('datepicker')
      fireEvent.change(inputDatepicker, { target: { value: '2023-01-01' } })
      expect(inputDatepicker).toHaveValue('2023-01-01')

      const inputAmount = screen.getByTestId('amount')
      await userEvent.type(inputAmount, '100')
      expect(inputAmount).toHaveValue(100)

      const inputVat = screen.getByTestId('vat')
      await userEvent.type(inputVat, '20')
      expect(inputVat).toHaveValue(20)

      const inputVatPercent = screen.getByTestId('pct')
      await userEvent.type(inputVatPercent, '20')
      expect(inputVatPercent).toHaveValue(20)

      const inputCommentary = screen.getByTestId('commentary')
      await userEvent.type(inputCommentary, 'Test commentary')
      expect(inputCommentary).toHaveValue('Test commentary')
    })

    test('Then the form is submitted and it should navigate to Bills page', async () => {
      fireEvent.submit(newBillForm)
      await new Promise(process.nextTick)
      expect(spyHandleSubmit).toHaveBeenCalled()
      expect(window.location.hash).toEqual(ROUTES_PATH.Bills)
    })
  })
})

// test d'intégration POST
describe('Given I am connected as an employee', () => {
  describe('When I navigate to NewBills and create a new bill by uploading a valid proof document', () => {
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee',
      email: 'a@a'
    }))
    const root = document.createElement('div')
    root.setAttribute('id', 'root')
    document.body.innerHTML = ''
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.NewBill)

    const newBill= new NewBill({
      document, onNavigate, store: mockStore, bills: bills, localStorage: window.localStorage
    })
    const fileInput = screen.getByTestId('file')
    fileInput.addEventListener('change', newBill.handleChangeFile)
    const file = new File(['TestFile'], 'test.jpg', {type: 'image/jpeg'})
    userEvent.upload(fileInput, file)

    test('Then it should post bill to mock API POST', async () => {
      await new Promise(process.nextTick)
      expect(newBill.fileName).toEqual('test.jpg')
      expect(newBill.fileUrl).toEqual('https://localhost:3456/images/test.jpg')
      expect(newBill.billId).toEqual('1234')
    })

    describe('When an error occurs on API', () => {
      beforeEach(() => {
        jest.spyOn(mockStore, 'bills')
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: 'a@a'
        }))
        const root = document.createElement('div')
        root.setAttribute('id', 'root')
        document.body.innerHTML = ''
        document.body.append(root)
        router()
      })

      test('post bill to an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create : () =>  {
              return Promise.reject(new Error('Erreur 404'))
            }
          }})
        window.onNavigate(ROUTES_PATH.NewBill)

        const spyConsoleError = jest.spyOn(global.console, 'error');

        const fileInput = screen.getByTestId('file')
        const file = new File(['TestFile'], 'test.jpg', {type: 'image/jpeg'})
        userEvent.upload(fileInput, file)

        await new Promise(process.nextTick);
        expect(spyConsoleError).toHaveBeenCalled()
        expect(spyConsoleError).toHaveBeenCalledWith(new Error('Erreur 404'))
      })

      test('post bill to an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create : () =>  {
              return Promise.reject(new Error('Erreur 500'))
            }
          }})
        window.onNavigate(ROUTES_PATH.NewBill)

        const spyConsoleError = jest.spyOn(global.console, 'error');

        const fileInput = screen.getByTestId('file')
        const file = new File(['TestFile'], 'test.jpg', {type: 'image/jpeg'})
        userEvent.upload(fileInput, file)

        await new Promise(process.nextTick);
        expect(spyConsoleError).toHaveBeenCalled()
        expect(spyConsoleError).toHaveBeenCalledWith(new Error('Erreur 500'))
      })
    })
  })
})
