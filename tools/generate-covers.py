"""Reproduce the site's conceptual scientific cover images (synthetic data only)."""
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.patches import Ellipse

OUT=Path(__file__).resolve().parents[1]/'assets/img/covers'
OUT.mkdir(parents=True,exist_ok=True)
bg='#102b38';teal='#79e0cd';blue='#71adf0';muted='#7397a7';white='#e6f3f6';orange='#f5b485'
cmap=LinearSegmentedColormap.from_list('ocean',['#305b90','#62b9c7','#bbf0d0'])
plt.rcParams.update({'font.family':'DejaVu Sans','text.color':white,'axes.labelcolor':muted,'xtick.color':muted,'ytick.color':muted,'axes.edgecolor':'#34515f','font.size':12})
def canvas(three=False):
 f=plt.figure(figsize=(12,7.5),facecolor=bg)
 a=f.add_axes([.12,.17,.78,.65],projection='3d' if three else None,facecolor=bg)
 return f,a

def finish(f,a,name,label,sub):
 f.text(.055,.9,label,fontsize=15,color=white,weight='medium')
 f.text(.055,.065,sub,fontsize=11,color=muted)
 f.savefig(OUT/f'{name}.png',dpi=100,facecolor=bg)
 plt.close(f)

def clean(a):
 a.spines[['top','right']].set_visible(False)
 a.grid(alpha=.12,color=muted)

f,a=canvas(True)
x,y=np.meshgrid(np.linspace(-3,3,58),np.linspace(-3,3,42));z=.8*np.sin(x)+.5*np.cos(y*1.4)+.16*x*y
a.scatter(x,y,z,c=z,cmap=cmap,s=5,alpha=.9,linewidths=0)
a.view_init(elev=27,azim=-60);a.set_axis_off();a.set_box_aspect((1,1,.48));a.set_position([0,-.05,1,1])
finish(f,a,'geometry','01  /  GEOMETRIC PERCEPTION','3D STRUCTURE  /  SYNTHETIC POINT CLOUD')
f,a=canvas(True)
u,v=np.meshgrid(np.linspace(-2.8,2.8,90),np.linspace(-2.3,2.3,65));z=.38*(u*u-v*v)
a.plot_surface(u,v,z,cmap=cmap,rstride=3,cstride=3,linewidth=.35,edgecolor='#387688',alpha=.97)
a.view_init(elev=24,azim=-56);a.set_axis_off();a.set_box_aspect((1,1,.6));a.set_position([0,-.06,1,1])
finish(f,a,'learning','02  /  DEEP LEARNING','GEOMETRIC MANIFOLD  /  CONCEPTUAL FEATURE FIELD')
f,a=canvas();rng=np.random.default_rng(52);cov=np.array([[1.5,.65],[.65,.6]]);pts=rng.multivariate_normal([0,0],cov,85)
a.scatter(*pts.T,s=12,color=blue,alpha=.55)
vals,vecs=np.linalg.eigh(cov);angle=np.degrees(np.arctan2(vecs[1,-1],vecs[0,-1]))
for k in [1,2,3]:a.add_patch(Ellipse((0,0),2*k*np.sqrt(vals[-1]),2*k*np.sqrt(vals[0]),angle=angle,fill=False,edgecolor=teal,alpha=1-.18*k,linewidth=1.8))
a.scatter([0],[0],marker='+',color=white,s=130,linewidths=2);a.set(xlim=(-4.4,4.4),ylim=(-3,3),xlabel='Position x',ylabel='Position y');clean(a)
finish(f,a,'uncertainty','03  /  UNCERTAINTY QUANTIFICATION','SYNTHETIC OBSERVATIONS  /  COVARIANCE ELLIPSES')
f,a=canvas();x=np.linspace(-3,3,40);y=.5*x+rng.normal(0,.19,len(x));xo=np.array([1.4,1.8,2.2,2.6,2.8]);yo=np.array([-2.1,-2.8,-2.4,-1.9,-2.7]);coef=np.polyfit(np.r_[x,xo],np.r_[y,yo],1)
a.scatter(x,y,color=teal,s=22,label='Inliers');a.scatter(xo,yo,color=orange,s=38,marker='x',label='Outliers');a.plot(x,np.polyval(coef,x),color=orange,alpha=.8,ls='--',label='Least squares');a.plot(x,.5*x,color=teal,lw=2,label='Underlying trend');a.set(xlabel='Observation x',ylabel='Observation y',ylim=(-3.2,2.3));clean(a);a.legend(frameon=False,fontsize=10,labelcolor=white,loc='upper left',ncol=2)
finish(f,a,'gnc-1','GNC  /  01','ROBUST ESTIMATION  /  WHY OUTLIERS MATTER')
f,a=canvas();r=np.linspace(-4,4,350)
for mu,c in [(16,blue),(4,'#44b2b8'),(1,teal)]:a.plot(r,(mu/(r*r+mu))**2,color=c,lw=2.5,label=f'μ = {mu}')
a.set(xlabel='Residual r',ylabel='Measurement weight w',ylim=(-.05,1.15));clean(a);a.legend(frameon=False,labelcolor=white,fontsize=11)
finish(f,a,'gnc-2','GNC  /  02','BLACK–RANGARAJAN DUALITY  /  GM WEIGHTS (c = 1)')
f,a=canvas();r=np.linspace(-3,3,350)
for mu,c in [(64,blue),(8,'#4396b1'),(2,'#49bbaa'),(1,teal)]:a.plot(r,mu*r*r/(mu+r*r),color=c,lw=2.5,label=f'μ = {mu}')
a.set(xlabel='Residual r',ylabel='Surrogate cost',ylim=(-.2,8.5));clean(a);a.legend(frameon=False,labelcolor=white,fontsize=11,loc='upper center',ncol=2)
finish(f,a,'gnc-3','GNC  /  03','CONTINUATION  /  GM SURROGATES (c = 1)')
print('Generated six 1200 × 750 conceptual covers.')
