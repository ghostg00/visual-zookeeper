import React from 'react';
import { connect } from 'dva';
import { Card, Form } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { AnyAction, Dispatch } from 'redux';
import { StateType } from '@/pages/home/model';

interface HomeProps extends FormComponentProps {
  home: StateType;
  dispatch: Dispatch<AnyAction>;
  loading: boolean;
}

function Home(props: HomeProps) {
  return (
    <>
      <Card>怎么写？</Card>
      <Card>要写的zookeeper 可视化工具</Card>
    </>
  );
}

const mapStateToProps = ({
  home,
  loading,
}: {
  home: StateType;
  loading: { models: { [key: string]: boolean } };
}) => ({
  home,
  loading: loading.models.home,
});

export default connect(mapStateToProps)(Form.create({ name: 'form' })(Home));
