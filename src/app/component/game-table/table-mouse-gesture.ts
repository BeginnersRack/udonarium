import { InputHandler } from 'directive/input-handler';
import { Transform } from '@udonarium/transform/transform'; // 2022/05/28 Takayama追加 "@udonarium/"はtsconfig.jsonに定義済み
import type { GameTableComponent } from './game-table.component';  // 2022/05/28 Takayama 追加  TableMouseGestureからGameTableComponentのプロパティを参照するため
// import { ElementRef } from '@angular/core';                 // 2022/05/28 Takayama追加

export const swTableRotateCenterFlg:number=1;   // 2022/05/28 Takayama追加  ：  =1 で 画面中心回転, =0でテーブル中心回転

type Callback = (srcEvent: TouchEvent | MouseEvent | PointerEvent) => void;
type OnTransformCallback = (transformX: number, transformY: number, transformZ: number, rotateX: number, rotateY: number, rotateZ: number, event: TableMouseGestureEvent, srcEvent: TouchEvent | MouseEvent | PointerEvent | KeyboardEvent) => void;

export enum TableMouseGestureEvent {
  DRAG = 'drag',
  ZOOM = 'zoom',
  ROTATE = 'rotate',
  KEYBOARD = 'keyboard',
}

enum Keyboard {
  ArrowLeft = 'ArrowLeft',
  ArrowUp = 'ArrowUp',
  ArrowRight = 'ArrowRight',
  ArrowDown = 'ArrowDown',
}

export class TableMouseGesture { 
  private currentPositionX: number = 0;
  private currentPositionY: number = 0;

  private buttonCode: number = 0;
  private input: InputHandler = null;

  public parent:GameTableComponent;        // 2022/05/28 Takayama 追加   TableMouseGestureからGameTableComponentのプロパティを参照するため

  get isGrabbing(): boolean { return this.input.isGrabbing; }
  get isDragging(): boolean { return this.input.isDragging; }

  private callbackOnWheel = (e) => this.onWheel(e);
  private callbackOnKeydown = (e) => this.onKeydown(e);

  onstart: Callback = null;
  onend: Callback = null;
  ontransform: OnTransformCallback = null;

  constructor(readonly targetElement: HTMLElement) {
    this.initialize();
  }

  private initialize() {
    this.input = new InputHandler(this.targetElement, { capture: true });
    this.addEventListeners();
    this.input.onStart = this.onInputStart.bind(this);
    this.input.onMove = this.onInputMove.bind(this);
    this.input.onEnd = this.onInputEnd.bind(this);
  }

  cancel() {
    this.input.cancel();
  }

  destroy() {
    this.input.destroy();
    this.removeEventListeners();
  }

  onInputStart(ev: any) {
    this.currentPositionX = this.input.pointer.x;
    this.currentPositionY = this.input.pointer.y;
    this.buttonCode = ev.button;
    if (this.onstart) this.onstart(ev);
  }

  onInputEnd(ev: any) {
    if (this.onend) this.onend(ev);
  }

  onInputMove(ev: any) {
    let x = this.input.pointer.x;
    let y = this.input.pointer.y;
    let deltaX = x - this.currentPositionX;
    let deltaY = y - this.currentPositionY;

    let transformX = 0;
    let transformY = 0;
    let transformZ = 0;

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;

    let event = TableMouseGestureEvent.DRAG;

    if (this.buttonCode === 2) { // 右クリック
      event = TableMouseGestureEvent.ROTATE;
      rotateZ = -deltaX / 5;
      rotateX = -deltaY / 5;
      
      
      
      
    } else {                     // 左クリック
        
        switch(swTableRotateCenterFlg){   // 2022/05/28 Takayama追加
          case 0:     // テーブル中心回転         // 2022/05/28 Takayama追加
              transformX = deltaX;
              transformY = deltaY;
            break;                                // 2022/05/28 Takayama追加
          
        // 2022/05/28 Takayama追加ここから
          case 1:    // 画面中心回転
          
            var u=(1e3+Math.abs(this.parent.viewPotisonZ))/1e3;    // Z軸方向：距離1000を基準にしたカメラ位置
            transformX =deltaX*u;
            transformY =deltaY*u;
            transformZ = 0;

            let RotateXdeg = (this.parent.viewRotateX % 360); // reverse
            if (RotateXdeg<0){RotateXdeg+=360;}
            if ((RotateXdeg>90)&&(RotateXdeg<270)){
                transformY=-transformY;
            }

            // 画像移動量
            let dx = transformX;    //X軸方向移動
            let dy = transformY;    //Y軸方向移動
            let dz = transformZ;


            // 回転中心が画像中心からずれているための移動量補正をおこなう
            let ex,ey,ez , bp;
            bp=myMtrx( {x:dx,y:dy,z:dz} ,  0 ,0, this.parent.viewRotateZ ,1);
            ex=bp.x,ey=bp.y,ez=bp.z;
            
            // 回転中心位置を 画面移動量に合わせて修正する
            let zeropos,basepos;
            basepos = {x:ex,y:ey,z:ez,w:1};
            zeropos = {x:0,y:0,z:0,w:1};
            
            dx= basepos.x -zeropos.x;
            dy= basepos.y -zeropos.y;
            dz= basepos.z -zeropos.z;
            
            
            //結果に対する補正処理
            let sz = Math.sin(( this.parent.viewRotateZ )/180*Math.PI);
            let cz = Math.cos(( this.parent.viewRotateZ )/180*Math.PI);
            let ddx = dx*cz - dy*sz;
            let ddy = dx*sz + dy*cz;
            let ssx= Math.sin(( this.parent.viewRotateX )/180*Math.PI);
            ex=dx,ey=dy,ez=dz-ddy*ssx;
            
            transformX = ex;
            transformY = ey;
            transformZ = ez;
          
        }
        // 2022/05/28 Takayama追加ここまで
    }

    this.currentPositionX = x;
    this.currentPositionY = y;

    if (this.ontransform) this.ontransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ, event, ev);
  }

  onWheel(ev: WheelEvent) {
    let pixelDeltaY = 0;
    switch (ev.deltaMode) {
      case WheelEvent.DOM_DELTA_LINE:
        pixelDeltaY = ev.deltaY * 16;
        break;
      case WheelEvent.DOM_DELTA_PAGE:
        pixelDeltaY = ev.deltaY * window.innerHeight;
        break;
      default:
        pixelDeltaY = ev.deltaY;
        break;
    }

    let transformX = 0;
    let transformY = 0;
    let transformZ = 0;

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;

    transformZ = pixelDeltaY * -1.5;
    if (300 ** 2 < transformZ ** 2) transformZ = Math.min(Math.max(transformZ, -300), 300);

    if (this.ontransform) this.ontransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ, TableMouseGestureEvent.ZOOM, ev);
  }

  onKeydown(ev: KeyboardEvent) {
    let transformX = 0;
    let transformY = 0;
    let transformZ = 0;

    let rotateX = 0;
    let rotateY = 0;
    let rotateZ = 0;

    let key = this.getKeyName(ev);
    switch (key) {
      case Keyboard.ArrowLeft:
        if (ev.shiftKey) {
          rotateZ = -2;
        } else {
          transformX = 10;
        }
        break;
      case Keyboard.ArrowUp:
        if (ev.shiftKey) {
          rotateX = -2;
        } else if (ev.ctrlKey) {
          transformZ = 150;
        } else {
          transformY = 10;
        }
        break;
      case Keyboard.ArrowRight:
        if (ev.shiftKey) {
          rotateZ = 2;
        } else {
          transformX = -10;
        }
        break;
      case Keyboard.ArrowDown:
        if (ev.shiftKey) {
          rotateX = 2;
        } else if (ev.ctrlKey) {
          transformZ = -150;
        } else {
          transformY = -10;
        }
        break;
    }
    let isArrowKey = Keyboard[key] != null;
    if (isArrowKey && this.ontransform) this.ontransform(transformX, transformY, transformZ, rotateX, rotateY, rotateZ, TableMouseGestureEvent.KEYBOARD, ev);
  }

  private getKeyName(keyboard: KeyboardEvent): string {
    if (keyboard.key) return keyboard.key;
    switch (keyboard.keyCode) {
      case 37: return Keyboard.ArrowLeft;
      case 38: return Keyboard.ArrowUp;
      case 39: return Keyboard.ArrowRight;
      case 40: return Keyboard.ArrowDown;
      default: return '';
    }
  }

  private addEventListeners() {
    this.targetElement.addEventListener('wheel', this.callbackOnWheel, false);
    document.body.addEventListener('keydown', this.callbackOnKeydown, false);
  }

  private removeEventListeners() {
    this.targetElement.removeEventListener('wheel', this.callbackOnWheel, false);
    document.body.removeEventListener('keydown', this.callbackOnKeydown, false);
  }
}

// 2022/05/28 Takayama追加ここから
// =============================================
/**
* 行列演算する
* @param {number} x ,y ,z   ベクタ
* @param {MyMatrix} matrix  行列
* @return {MyAryNum} - 4値ベクタ
*/
interface MyAryNum {
  [index: string]: number
}
interface MyMatrix {
  m11:number; m21:number; m31:number; m41:number;
  m12:number; m22:number; m32:number; m42:number;
  m13:number; m23:number; m33:number; m43:number;
  m14:number; m24:number; m34:number; m44:number;
}
interface MyVetcor3 {
  x:number; y:number; z:number
}
export function myMtrxP(x:number,y:number,z:number,matrix:MyMatrix ):MyAryNum{
  let ret={x:0,y:0,z:0,w:1};
  let local = {x:0,y:0,z:0,w:1};
  local.x = x,local.y = y,local.z = z;
  
    ret.x = local.x * matrix.m11 + local.y * matrix.m21 + local.z * matrix.m31 + local.w * matrix.m41;
    ret.y = local.x * matrix.m12 + local.y * matrix.m22 + local.z * matrix.m32 + local.w * matrix.m42;
    ret.z = local.x * matrix.m13 + local.y * matrix.m23 + local.z * matrix.m33 + local.w * matrix.m43;
    ret.w = local.x * matrix.m14 + local.y * matrix.m24 + local.z * matrix.m34 + local.w * matrix.m44;
  
  return ret;
}
// =============================================
/**
* 回転行列演算する
* @param {MyVetcor3} orgpos   ベクタ
* @param {number} rx,ry,rz   回転角
* @return {MyAryNum} - 4値ベクタ
*/
export function myMtrx(orgpos:MyVetcor3, rx:number, ry:number, rz:number, rr:number=0):MyAryNum{
  let sx = Math.sin(rx/180*Math.PI);
  let cx = Math.cos(rx/180*Math.PI);
  let sy = Math.sin(ry/180*Math.PI);
  let cy = Math.cos(ry/180*Math.PI);
  let sz = Math.sin(rz/180*Math.PI);
  let cz = Math.cos(rz/180*Math.PI);
  
  let m11 = cy*cz;
  let m12 = sx*sy*cz - cx*sz;
  let m13 = cx*sy*cz + sx*sz;
  let m21 = cy*sz;
  let m22 = sx*sy*sz + cx*cz;
  let m23 = cx*sy*sz - sx*cz;
  let m31 = 0-sy;
  let m32 = sx*cy;
  let m33 = cx*cy;
  
  if(rr){
    let m00=0;
    m00=m12;m12=m21;m21=m00;
    m00=m13;m13=m31;m31=m00;
    m00=m23;m23=m32;m32=m00;
  }
  let ans={x:0,y:0,z:0,w:1};
  ans.x = m11*(orgpos.x) + m12*(orgpos.y) + m13*(orgpos.z);
  ans.y = m21*(orgpos.x) + m22*(orgpos.y) + m23*(orgpos.z);
  ans.z = m31*(orgpos.x) + m32*(orgpos.y) + m33*(orgpos.z);
  return ans;
}
// =============================================
/**
*  p1,p2,p3 を通る平面方程式 ax+by+cz=d の係数を返す
* @param {MyAryNum} p1,p2,p3  3次元ベクタ
* @return {MyAryNum} - 4値ベクタ
*/
export function myPlane3D(p1:MyAryNum, p2:MyAryNum, p3:MyAryNum):MyAryNum{
  let ret={a:0,b:0,c:0,d:0};
  
  let v1={x:p2.x-p1.x, y:p2.y-p1.y, z:p2.z-p1.z}
  let v2={x:p3.x-p1.x, y:p3.y-p1.y, z:p3.z-p1.z}
  ret.a = v1.y*v2.z - v1.z*v2.y;
  ret.b = v1.z*v2.x - v1.x*v2.z;
  ret.c = v1.x*v2.y - v1.y*v2.x;
  ret.d = ret.a*p1.x + ret.b*p1.y + ret.c*p1.z;
  
  return ret;
}

// 2022/05/28 Takayama追加ここまで
